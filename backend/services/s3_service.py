import boto3
import os
import uuid
from fastapi import UploadFile
from botocore.exceptions import ClientError

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)

BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')

async def upload_file_to_s3(file: UploadFile, folder: str = '') -> str:
    """
    Upload a file to S3 and return the URL
    """
    try:
        # Basic validation
        if not file:
            raise ValueError("File is None")
            
        if not file.filename:
            raise ValueError("Filename is missing")
        
        # Read file content (only once!)
        file_content = await file.read()
        if not file_content:
            raise ValueError("File content is empty")
            
        # Check if the filename contains base64 data
        if 'base64' in file.filename:
            # Extract the content type from the filename if possible
            content_type = file.content_type
            if not content_type and 'data:' in file.filename and ';base64' in file.filename:
                content_type = file.filename.split('data:')[1].split(';')[0]
            
            # Generate a proper filename instead of using the base64 string
            unique_filename = f"{uuid.uuid4().hex}.jpg"  # Default to jpg for images
            if content_type:
                ext = content_type.split('/')[-1]
                unique_filename = f"{uuid.uuid4().hex}.{ext}"
        else:
            # Normal file handling
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}" if file_extension else f"{uuid.uuid4().hex}"
        
        # Create S3 path with optional folder
        s3_path = f"{folder}/{unique_filename}" if folder else unique_filename
        
        # Set content type with fallback
        content_type = file.content_type or 'application/octet-stream'
        
        # Upload to S3
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_path,
            Body=file_content,
            ContentType=content_type
        )
        
        # Generate URL
        url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_path}"
        return url
        
    except ValueError as e:
        raise Exception(f"Validation error during S3 upload: {str(e)}")
    except ClientError as e:
        raise Exception(f"AWS S3 error: {str(e)}")
    except Exception as e:
        raise Exception(f"S3 upload error: {str(e)}")

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