from fastapi import HTTPException

class BodySizeLimitMiddleware:
    """
    Stops reading a request once its body passes max_bytes. Starlette spools
    multipart uploads to disk before a route runs, so a check inside the route is
    too late. Counts what actually arrives rather than trusting Content-Length.
    """

    def __init__(self, app, max_bytes: int):
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        received = 0

        async def limited_receive():
            nonlocal received
            message = await receive()
            if message['type'] == 'http.request':
                received += len(message.get('body', b''))
                if received > self.max_bytes:
                    raise HTTPException(status_code=413, detail='Request is too large')
            return message

        await self.app(scope, limited_receive, send)
