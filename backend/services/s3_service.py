import boto3
import hashlib
import hmac
import io
import os
import uuid
from typing import Optional, Tuple
from fastapi import HTTPException, Response, UploadFile
from botocore.exceptions import ClientError
from PIL import Image

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)

BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')

# The client compresses to 2 MB at most; this leaves room for the larger PNG that
# background removal hands back.
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
# Checked from the header, before any decoding. A small file can claim a huge
# canvas, and it is the canvas that costs memory.
MAX_IMAGE_PIXELS = 25_000_000

# Pillow format -> (extension, content type). SVG is left out on purpose: it can
# carry scripts.
IMAGE_FORMATS = {
    'JPEG': ('jpg', 'image/jpeg'),
    'PNG': ('png', 'image/png'),
    'WEBP': ('webp', 'image/webp'),
    'GIF': ('gif', 'image/gif'),
}

# 'image/jpg' is not a real type, but older uploads stored whatever the client sent.
SERVABLE_CONTENT_TYPES = {content_type for _, content_type in IMAGE_FORMATS.values()} | {'image/jpg'}

async def read_image_upload(file: UploadFile) -> Tuple[bytes, str]:
    """
    Return the upload's bytes and its real Pillow format. The filename and content
    type both come from the client, so neither is trusted; the format is read from
    the bytes themselves.
    """
    content = await file.read(MAX_UPLOAD_BYTES + 1)

    if not content:
        raise HTTPException(status_code=400, detail='Image file is empty')

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail='Image is too large')

    try:
        with Image.open(io.BytesIO(content), formats=tuple(IMAGE_FORMATS)) as image:
            image_format = image.format
            width, height = image.size
            image.verify()
    except Exception:
        raise HTTPException(status_code=400, detail='File must be a JPEG, PNG, WebP or GIF image')

    if width * height > MAX_IMAGE_PIXELS:
        raise HTTPException(status_code=413, detail='Image dimensions are too large')

    return content, image_format

async def upload_file_to_s3(file: UploadFile, folder: str = '') -> str:
    """
    Upload an image to S3 and return the URL
    """
    file_content, image_format = await read_image_upload(file)
    extension, content_type = IMAGE_FORMATS[image_format]

    # Create S3 path with optional folder
    unique_filename = f"{uuid.uuid4().hex}.{extension}"
    s3_path = f"{folder}/{unique_filename}" if folder else unique_filename

    try:
        # Upload to S3
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_path,
            Body=file_content,
            ContentType=content_type
        )
    except ClientError as e:
        raise Exception(f"AWS S3 error: {str(e)}")

    # Generate URL
    url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_path}"
    return url

def image_response(s3_object: dict) -> Response:
    """
    Turn an S3 get_object result into a response. Objects uploaded before
    validation existed can hold anything, so a stored type that is not an image is
    never echoed back: an HTML file served as text/html would run on the API's
    domain.
    """
    content_type = s3_object.get('ContentType', 'image/jpeg')
    if content_type not in SERVABLE_CONTENT_TYPES:
        content_type = 'application/octet-stream'

    return Response(
        content=s3_object['Body'].read(),
        media_type=content_type,
        headers={'X-Content-Type-Options': 'nosniff'}
    )

def image_token(url: Optional[str]) -> Optional[str]:
    """
    Proof that the API already showed this image to the caller. The image routes
    are loaded by plain <img> tags, which cannot send the login header, so a
    private list's images are served only to a request carrying this. It is
    derived from the stored URL, so replacing an image changes the token.
    """
    if not url:
        return None
    return hmac.new(
        os.getenv('JWT_SECRET', '').encode('utf-8'),
        f'image:{url}'.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()[:32]

def image_token_matches(url: Optional[str], token: Optional[str]) -> bool:
    expected = image_token(url)
    return bool(expected and token) and hmac.compare_digest(expected, token)

def delete_file_from_s3(url: str) -> bool:
    """
    Delete a file from S3 using its URL
    """
    try:
        # Extract the key from the URL
        key = url.split(f"https://{BUCKET_NAME}.s3.amazonaws.com/")[1]

        # Delete the object
        s3_client.delete_object(
            Bucket=BUCKET_NAME,
            Key=key
        )
        return True
    except Exception:
        return False
