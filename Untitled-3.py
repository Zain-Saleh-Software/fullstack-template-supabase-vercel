2026-05-12 00:22:36.381 | [error    ] request_cycle_error            [fullstack] duration_ms=8.54 error=invalid input for query argument $1: '' (invalid UUID '': length must be between 32..36 characters, got 0) method=POST path=/api/v1/contacts request_id=dea6f4ae-99bd-44ee-8fe0-4472b4091905 trace_id=dea6f4ae user_id=None
2026-05-12 00:22:36.422 | [error    ] unhandled_error                [fullstack] path=/api/v1/contacts request_id=dea6f4ae-99bd-44ee-8fe0-4472b4091905 trace_id=dea6f4ae user_id=None
2026-05-12 00:22:36.422 | Traceback (most recent call last):
2026-05-12 00:22:36.422 |   File "asyncpg/protocol/prepared_stmt.pyx", line 175, in asyncpg.protocol.protocol.PreparedStatementState._encode_bind_msg
2026-05-12 00:22:36.422 |   File "asyncpg/protocol/codecs/base.pyx", line 227, in asyncpg.protocol.protocol.Codec.encode
2026-05-12 00:22:36.422 |   File "asyncpg/protocol/codecs/base.pyx", line 129, in asyncpg.protocol.protocol.Codec.encode_scalar
2026-05-12 00:22:36.422 |   File "asyncpg/pgproto/./codecs/uuid.pyx", line 16, in asyncpg.pgproto.pgproto.uuid_encode
2026-05-12 00:22:36.422 |   File "asyncpg/pgproto/./uuid.pyx", line 88, in asyncpg.pgproto.pgproto.pg_uuid_bytes_from_str
2026-05-12 00:22:36.422 | INFO:     172.18.0.1:58320 - "POST /api/v1/contacts HTTP/1.1" 500 Internal Server Error
2026-05-12 00:22:36.422 | ValueError: invalid UUID '': length must be between 32..36 characters, got 0
2026-05-12 00:22:36.422 | 
2026-05-12 00:22:36.422 | The above exception was the direct cause of the following exception:
2026-05-12 00:22:36.422 | 
2026-05-12 00:22:36.422 | Traceback (most recent call last):
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/errors.py", line 165, in __call__
2026-05-12 00:22:36.422 |     await self.app(scope, receive, _send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/cors.py", line 93, in __call__
2026-05-12 00:22:36.422 |     await self.simple_response(scope, receive, send, request_headers=headers)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/cors.py", line 144, in simple_response
2026-05-12 00:22:36.422 |     await self.app(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.422 |     with collapse_excgroups():
2026-05-12 00:22:36.422 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.422 |     self.gen.throw(value)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.422 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/middleware/observability_middleware.py", line 33, in dispatch
2026-05-12 00:22:36.422 |     response: Response = await call_next(request)
2026-05-12 00:22:36.422 |                          ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.422 |     raise app_exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.422 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.422 |     with collapse_excgroups():
2026-05-12 00:22:36.422 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.422 |     self.gen.throw(value)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.422 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/middleware/request_logging_middleware.py", line 34, in dispatch
2026-05-12 00:22:36.422 |     response: Response = await call_next(request)
2026-05-12 00:22:36.422 |                          ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.422 |     raise app_exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.422 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/gzip.py", line 20, in __call__
2026-05-12 00:22:36.422 |     await responder(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/gzip.py", line 39, in __call__
2026-05-12 00:22:36.422 |     await self.app(scope, receive, self.send_with_gzip)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.422 |     with collapse_excgroups():
2026-05-12 00:22:36.422 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.422 |     self.gen.throw(value)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.422 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/main.py", line 138, in validate_host
2026-05-12 00:22:36.422 |     return await call_next(request)
2026-05-12 00:22:36.422 |            ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.422 |     raise app_exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.422 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.422 |     with collapse_excgroups():
2026-05-12 00:22:36.422 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.422 |     self.gen.throw(value)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.422 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/main.py", line 125, in validate_content_type
2026-05-12 00:22:36.422 |     return await call_next(request)
2026-05-12 00:22:36.422 |            ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.422 |     raise app_exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.422 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.422 |     with collapse_excgroups():
2026-05-12 00:22:36.422 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.422 |     self.gen.throw(value)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.422 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/main.py", line 111, in limit_body_size
2026-05-12 00:22:36.422 |     return await call_next(request)
2026-05-12 00:22:36.422 |            ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.422 |     raise app_exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.422 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.422 |     with collapse_excgroups():
2026-05-12 00:22:36.422 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.422 |     self.gen.throw(value)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.422 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/main.py", line 77, in add_security_headers
2026-05-12 00:22:36.422 |     response = await call_next(request)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.422 |     raise app_exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.422 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/exceptions.py", line 62, in __call__
2026-05-12 00:22:36.422 |     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 62, in wrapped_app
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 51, in wrapped_app
2026-05-12 00:22:36.422 |     await app(scope, receive, sender)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 715, in __call__
2026-05-12 00:22:36.422 |     await self.middleware_stack(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 735, in app
2026-05-12 00:22:36.422 |     await route.handle(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 288, in handle
2026-05-12 00:22:36.422 |     await self.app(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 76, in app
2026-05-12 00:22:36.422 |     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 62, in wrapped_app
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 51, in wrapped_app
2026-05-12 00:22:36.422 |     await app(scope, receive, sender)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 73, in app
2026-05-12 00:22:36.422 |     response = await f(request)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/fastapi/routing.py", line 301, in app
2026-05-12 00:22:36.422 |     raw_response = await run_endpoint_function(
2026-05-12 00:22:36.422 |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/fastapi/routing.py", line 212, in run_endpoint_function
2026-05-12 00:22:36.422 |     return await dependant.call(**values)
2026-05-12 00:22:36.422 |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/api/v1/contacts.py", line 46, in create_contact
2026-05-12 00:22:36.422 |     contact = await contact_service.create(body.model_dump(exclude_none=True))
2026-05-12 00:22:36.422 |               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/core/observability.py", line 91, in async_wrapper
2026-05-12 00:22:36.422 |     result = await func(*args, **kwargs)
2026-05-12 00:22:36.422 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/services/contact_service.py", line 37, in create
2026-05-12 00:22:36.422 |     contact = await get_orm().create(Contact, data)
2026-05-12 00:22:36.422 |               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/core/observability.py", line 118, in wrapper
2026-05-12 00:22:36.422 |     result = await func(*args, **kwargs)
2026-05-12 00:22:36.422 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/core/observability.py", line 91, in async_wrapper
2026-05-12 00:22:36.422 |     result = await func(*args, **kwargs)
2026-05-12 00:22:36.422 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/orm/postgres_orm.py", line 208, in create
2026-05-12 00:22:36.422 |     row = await conn.fetchrow(
2026-05-12 00:22:36.422 |           ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/asyncpg/connection.py", line 748, in fetchrow
2026-05-12 00:22:36.422 |     data = await self._execute(
2026-05-12 00:22:36.422 |            ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/asyncpg/connection.py", line 1864, in _execute
2026-05-12 00:22:36.422 |     result, _ = await self.__execute(
2026-05-12 00:22:36.422 |                 ^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/asyncpg/connection.py", line 1961, in __execute
2026-05-12 00:22:36.422 |     result, stmt = await self._do_execute(
2026-05-12 00:22:36.422 |                    ^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/asyncpg/connection.py", line 2027, in _do_execute
2026-05-12 00:22:36.422 |     result = await executor(stmt, timeout)
2026-05-12 00:22:36.422 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "asyncpg/protocol/protocol.pyx", line 185, in bind_execute
2026-05-12 00:22:36.422 |   File "asyncpg/protocol/prepared_stmt.pyx", line 204, in asyncpg.protocol.protocol.PreparedStatementState._encode_bind_msg
2026-05-12 00:22:36.422 | asyncpg.exceptions.DataError: invalid input for query argument $1: '' (invalid UUID '': length must be between 32..36 characters, got 0)
2026-05-12 00:22:36.422 | Traceback (most recent call last):
2026-05-12 00:22:36.422 |   File "asyncpg/protocol/prepared_stmt.pyx", line 175, in asyncpg.protocol.protocol.PreparedStatementState._encode_bind_msg
2026-05-12 00:22:36.422 |   File "asyncpg/protocol/codecs/base.pyx", line 227, in asyncpg.protocol.protocol.Codec.encode
2026-05-12 00:22:36.422 |   File "asyncpg/protocol/codecs/base.pyx", line 129, in asyncpg.protocol.protocol.Codec.encode_scalar
2026-05-12 00:22:36.422 |   File "asyncpg/pgproto/./codecs/uuid.pyx", line 16, in asyncpg.pgproto.pgproto.uuid_encode
2026-05-12 00:22:36.422 |   File "asyncpg/pgproto/./uuid.pyx", line 88, in asyncpg.pgproto.pgproto.pg_uuid_bytes_from_str
2026-05-12 00:22:36.422 | ValueError: invalid UUID '': length must be between 32..36 characters, got 0
2026-05-12 00:22:36.422 | 
2026-05-12 00:22:36.422 | The above exception was the direct cause of the following exception:
2026-05-12 00:22:36.422 | 
2026-05-12 00:22:36.422 | Traceback (most recent call last):
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/errors.py", line 165, in __call__
2026-05-12 00:22:36.422 |     await self.app(scope, receive, _send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/cors.py", line 93, in __call__
2026-05-12 00:22:36.422 |     await self.simple_response(scope, receive, send, request_headers=headers)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/cors.py", line 144, in simple_response
2026-05-12 00:22:36.422 |     await self.app(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.422 |     with collapse_excgroups():
2026-05-12 00:22:36.422 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.422 |     self.gen.throw(value)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.422 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/middleware/observability_middleware.py", line 33, in dispatch
2026-05-12 00:22:36.422 |     response: Response = await call_next(request)
2026-05-12 00:22:36.422 |                          ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.422 |     raise app_exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.422 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.422 |     with collapse_excgroups():
2026-05-12 00:22:36.422 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.422 |     self.gen.throw(value)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.422 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/middleware/request_logging_middleware.py", line 34, in dispatch
2026-05-12 00:22:36.422 |     response: Response = await call_next(request)
2026-05-12 00:22:36.422 |                          ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.422 |     raise app_exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.422 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/gzip.py", line 20, in __call__
2026-05-12 00:22:36.422 |     await responder(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/gzip.py", line 39, in __call__
2026-05-12 00:22:36.422 |     await self.app(scope, receive, self.send_with_gzip)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.422 |     with collapse_excgroups():
2026-05-12 00:22:36.422 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.422 |     self.gen.throw(value)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.422 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/main.py", line 138, in validate_host
2026-05-12 00:22:36.422 |     return await call_next(request)
2026-05-12 00:22:36.422 |            ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.422 |     raise app_exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.422 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.422 |     with collapse_excgroups():
2026-05-12 00:22:36.422 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.422 |     self.gen.throw(value)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.422 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/main.py", line 125, in validate_content_type
2026-05-12 00:22:36.422 |     return await call_next(request)
2026-05-12 00:22:36.422 |            ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.422 |     raise app_exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.422 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.422 |     with collapse_excgroups():
2026-05-12 00:22:36.422 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.422 |     self.gen.throw(value)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.422 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/main.py", line 111, in limit_body_size
2026-05-12 00:22:36.422 |     return await call_next(request)
2026-05-12 00:22:36.422 |            ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.422 |     raise app_exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.422 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.422 |     with collapse_excgroups():
2026-05-12 00:22:36.422 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.422 |     self.gen.throw(value)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.422 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/main.py", line 77, in add_security_headers
2026-05-12 00:22:36.422 |     response = await call_next(request)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.422 |     raise app_exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.422 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/exceptions.py", line 62, in __call__
2026-05-12 00:22:36.422 |     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 62, in wrapped_app
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 51, in wrapped_app
2026-05-12 00:22:36.422 |     await app(scope, receive, sender)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 715, in __call__
2026-05-12 00:22:36.422 |     await self.middleware_stack(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 735, in app
2026-05-12 00:22:36.422 |     await route.handle(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 288, in handle
2026-05-12 00:22:36.422 |     await self.app(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 76, in app
2026-05-12 00:22:36.422 |     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 62, in wrapped_app
2026-05-12 00:22:36.422 |     raise exc
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 51, in wrapped_app
2026-05-12 00:22:36.422 |     await app(scope, receive, sender)
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 73, in app
2026-05-12 00:22:36.422 |     response = await f(request)
2026-05-12 00:22:36.422 |                ^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/fastapi/routing.py", line 301, in app
2026-05-12 00:22:36.422 |     raw_response = await run_endpoint_function(
2026-05-12 00:22:36.422 |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/fastapi/routing.py", line 212, in run_endpoint_function
2026-05-12 00:22:36.422 |     return await dependant.call(**values)
2026-05-12 00:22:36.422 |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/api/v1/contacts.py", line 46, in create_contact
2026-05-12 00:22:36.422 |     contact = await contact_service.create(body.model_dump(exclude_none=True))
2026-05-12 00:22:36.422 |               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/core/observability.py", line 91, in async_wrapper
2026-05-12 00:22:36.422 |     result = await func(*args, **kwargs)
2026-05-12 00:22:36.422 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/services/contact_service.py", line 37, in create
2026-05-12 00:22:36.422 |     contact = await get_orm().create(Contact, data)
2026-05-12 00:22:36.422 |               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/core/observability.py", line 118, in wrapper
2026-05-12 00:22:36.422 |     result = await func(*args, **kwargs)
2026-05-12 00:22:36.422 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/core/observability.py", line 91, in async_wrapper
2026-05-12 00:22:36.422 |     result = await func(*args, **kwargs)
2026-05-12 00:22:36.422 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/app/app/orm/postgres_orm.py", line 208, in create
2026-05-12 00:22:36.422 |     row = await conn.fetchrow(
2026-05-12 00:22:36.422 |           ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/asyncpg/connection.py", line 748, in fetchrow
2026-05-12 00:22:36.422 |     data = await self._execute(
2026-05-12 00:22:36.422 |            ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/asyncpg/connection.py", line 1864, in _execute
2026-05-12 00:22:36.422 |     result, _ = await self.__execute(
2026-05-12 00:22:36.422 |                 ^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/asyncpg/connection.py", line 1961, in __execute
2026-05-12 00:22:36.422 |     result, stmt = await self._do_execute(
2026-05-12 00:22:36.422 |                    ^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "/home/app/.local/lib/python3.12/site-packages/asyncpg/connection.py", line 2027, in _do_execute
2026-05-12 00:22:36.422 |     result = await executor(stmt, timeout)
2026-05-12 00:22:36.422 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.422 |   File "asyncpg/protocol/protocol.pyx", line 185, in bind_execute
2026-05-12 00:22:36.422 |   File "asyncpg/protocol/prepared_stmt.pyx", line 204, in asyncpg.protocol.protocol.PreparedStatementState._encode_bind_msg
2026-05-12 00:22:36.422 | asyncpg.exceptions.DataError: invalid input for query argument $1: '' (invalid UUID '': length must be between 32..36 characters, got 0)
2026-05-12 00:22:36.456 | ERROR:    Exception in ASGI application
2026-05-12 00:22:36.456 | Traceback (most recent call last):
2026-05-12 00:22:36.456 |   File "asyncpg/protocol/prepared_stmt.pyx", line 175, in asyncpg.protocol.protocol.PreparedStatementState._encode_bind_msg
2026-05-12 00:22:36.456 |   File "asyncpg/protocol/codecs/base.pyx", line 227, in asyncpg.protocol.protocol.Codec.encode
2026-05-12 00:22:36.456 |   File "asyncpg/protocol/codecs/base.pyx", line 129, in asyncpg.protocol.protocol.Codec.encode_scalar
2026-05-12 00:22:36.456 |   File "asyncpg/pgproto/./codecs/uuid.pyx", line 16, in asyncpg.pgproto.pgproto.uuid_encode
2026-05-12 00:22:36.456 |   File "asyncpg/pgproto/./uuid.pyx", line 88, in asyncpg.pgproto.pgproto.pg_uuid_bytes_from_str
2026-05-12 00:22:36.456 | ValueError: invalid UUID '': length must be between 32..36 characters, got 0
2026-05-12 00:22:36.456 | 
2026-05-12 00:22:36.456 | The above exception was the direct cause of the following exception:
2026-05-12 00:22:36.456 | 
2026-05-12 00:22:36.456 | Traceback (most recent call last):
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/uvicorn/protocols/http/httptools_impl.py", line 401, in run_asgi
2026-05-12 00:22:36.456 |     result = await app(  # type: ignore[func-returns-value]
2026-05-12 00:22:36.456 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/uvicorn/middleware/proxy_headers.py", line 70, in __call__
2026-05-12 00:22:36.456 |     return await self.app(scope, receive, send)
2026-05-12 00:22:36.456 |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/fastapi/applications.py", line 1054, in __call__
2026-05-12 00:22:36.456 |     await super().__call__(scope, receive, send)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/applications.py", line 113, in __call__
2026-05-12 00:22:36.456 |     await self.middleware_stack(scope, receive, send)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/errors.py", line 187, in __call__
2026-05-12 00:22:36.456 |     raise exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/errors.py", line 165, in __call__
2026-05-12 00:22:36.456 |     await self.app(scope, receive, _send)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/cors.py", line 93, in __call__
2026-05-12 00:22:36.456 |     await self.simple_response(scope, receive, send, request_headers=headers)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/cors.py", line 144, in simple_response
2026-05-12 00:22:36.456 |     await self.app(scope, receive, send)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.456 |     with collapse_excgroups():
2026-05-12 00:22:36.456 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.456 |     self.gen.throw(value)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.456 |     raise exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.456 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.456 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/app/app/middleware/observability_middleware.py", line 33, in dispatch
2026-05-12 00:22:36.456 |     response: Response = await call_next(request)
2026-05-12 00:22:36.456 |                          ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.456 |     raise app_exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.456 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.456 |     with collapse_excgroups():
2026-05-12 00:22:36.456 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.456 |     self.gen.throw(value)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.456 |     raise exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.456 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.456 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/app/app/middleware/request_logging_middleware.py", line 34, in dispatch
2026-05-12 00:22:36.456 |     response: Response = await call_next(request)
2026-05-12 00:22:36.456 |                          ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.456 |     raise app_exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.456 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/gzip.py", line 20, in __call__
2026-05-12 00:22:36.456 |     await responder(scope, receive, send)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/gzip.py", line 39, in __call__
2026-05-12 00:22:36.456 |     await self.app(scope, receive, self.send_with_gzip)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.456 |     with collapse_excgroups():
2026-05-12 00:22:36.456 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.456 |     self.gen.throw(value)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.456 |     raise exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.456 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.456 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/app/app/main.py", line 138, in validate_host
2026-05-12 00:22:36.456 |     return await call_next(request)
2026-05-12 00:22:36.456 |            ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.456 |     raise app_exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.456 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.456 |     with collapse_excgroups():
2026-05-12 00:22:36.456 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.456 |     self.gen.throw(value)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.456 |     raise exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.456 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.456 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/app/app/main.py", line 125, in validate_content_type
2026-05-12 00:22:36.456 |     return await call_next(request)
2026-05-12 00:22:36.456 |            ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.456 |     raise app_exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.456 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.456 |     with collapse_excgroups():
2026-05-12 00:22:36.456 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.456 |     self.gen.throw(value)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.456 |     raise exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.456 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.456 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/app/app/main.py", line 111, in limit_body_size
2026-05-12 00:22:36.456 |     return await call_next(request)
2026-05-12 00:22:36.456 |            ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.456 |     raise app_exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.456 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 185, in __call__
2026-05-12 00:22:36.456 |     with collapse_excgroups():
2026-05-12 00:22:36.456 |          ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/usr/local/lib/python3.12/contextlib.py", line 158, in __exit__
2026-05-12 00:22:36.456 |     self.gen.throw(value)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_utils.py", line 83, in collapse_excgroups
2026-05-12 00:22:36.456 |     raise exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 187, in __call__
2026-05-12 00:22:36.456 |     response = await self.dispatch_func(request, call_next)
2026-05-12 00:22:36.456 |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/app/app/main.py", line 77, in add_security_headers
2026-05-12 00:22:36.456 |     response = await call_next(request)
2026-05-12 00:22:36.456 |                ^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 163, in call_next
2026-05-12 00:22:36.456 |     raise app_exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/base.py", line 149, in coro
2026-05-12 00:22:36.456 |     await self.app(scope, receive_or_disconnect, send_no_error)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/middleware/exceptions.py", line 62, in __call__
2026-05-12 00:22:36.456 |     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 62, in wrapped_app
2026-05-12 00:22:36.456 |     raise exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 51, in wrapped_app
2026-05-12 00:22:36.456 |     await app(scope, receive, sender)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 715, in __call__
2026-05-12 00:22:36.456 |     await self.middleware_stack(scope, receive, send)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 735, in app
2026-05-12 00:22:36.456 |     await route.handle(scope, receive, send)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 288, in handle
2026-05-12 00:22:36.456 |     await self.app(scope, receive, send)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 76, in app
2026-05-12 00:22:36.456 |     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 62, in wrapped_app
2026-05-12 00:22:36.456 |     raise exc
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/_exception_handler.py", line 51, in wrapped_app
2026-05-12 00:22:36.456 |     await app(scope, receive, sender)
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/starlette/routing.py", line 73, in app
2026-05-12 00:22:36.456 |     response = await f(request)
2026-05-12 00:22:36.456 |                ^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/fastapi/routing.py", line 301, in app
2026-05-12 00:22:36.456 |     raw_response = await run_endpoint_function(
2026-05-12 00:22:36.456 |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/fastapi/routing.py", line 212, in run_endpoint_function
2026-05-12 00:22:36.456 |     return await dependant.call(**values)
2026-05-12 00:22:36.456 |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/app/app/api/v1/contacts.py", line 46, in create_contact
2026-05-12 00:22:36.456 |     contact = await contact_service.create(body.model_dump(exclude_none=True))
2026-05-12 00:22:36.456 |               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/app/app/core/observability.py", line 91, in async_wrapper
2026-05-12 00:22:36.456 |     result = await func(*args, **kwargs)
2026-05-12 00:22:36.456 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/app/app/services/contact_service.py", line 37, in create
2026-05-12 00:22:36.456 |     contact = await get_orm().create(Contact, data)
2026-05-12 00:22:36.456 |               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/app/app/core/observability.py", line 118, in wrapper
2026-05-12 00:22:36.456 |     result = await func(*args, **kwargs)
2026-05-12 00:22:36.456 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/app/app/core/observability.py", line 91, in async_wrapper
2026-05-12 00:22:36.456 |     result = await func(*args, **kwargs)
2026-05-12 00:22:36.456 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/app/app/orm/postgres_orm.py", line 208, in create
2026-05-12 00:22:36.456 |     row = await conn.fetchrow(
2026-05-12 00:22:36.456 |           ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/asyncpg/connection.py", line 748, in fetchrow
2026-05-12 00:22:36.456 |     data = await self._execute(
2026-05-12 00:22:36.456 |            ^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/asyncpg/connection.py", line 1864, in _execute
2026-05-12 00:22:36.456 |     result, _ = await self.__execute(
2026-05-12 00:22:36.456 |                 ^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/asyncpg/connection.py", line 1961, in __execute
2026-05-12 00:22:36.456 |     result, stmt = await self._do_execute(
2026-05-12 00:22:36.456 |                    ^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "/home/app/.local/lib/python3.12/site-packages/asyncpg/connection.py", line 2027, in _do_execute
2026-05-12 00:22:36.456 |     result = await executor(stmt, timeout)
2026-05-12 00:22:36.456 |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-05-12 00:22:36.456 |   File "asyncpg/protocol/protocol.pyx", line 185, in bind_execute
2026-05-12 00:22:36.456 |   File "asyncpg/protocol/prepared_stmt.pyx", line 204, in asyncpg.protocol.protocol.PreparedStatementState._encode_bind_msg
2026-05-12 00:22:36.456 | asyncpg.exceptions.DataError: invalid input for query argument $1: '' (invalid UUID '': length must be between 32..36 characters, got 0)
2026-05-12 00:22:37.245 | INFO:     172.18.0.1:58328 - "GET /api/v1/changes/check?since=2026-05-11T21:22:12.122Z HTTP/1.1" 200 OK
