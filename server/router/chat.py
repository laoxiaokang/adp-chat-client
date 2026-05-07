import logging

import sanic
from sanic.views import HTTPMethodView
from sanic_restful_api import reqparse
from sanic.request.types import Request
from sanic.response import ResponseStream
from sanic.exceptions import SanicException

from router import login_required, check_login
from core.chat import CoreChat
from core.conversation import CoreConversation
from core.share import CoreShareConversation
from app_factory import TAgenticApp
app: TAgenticApp = TAgenticApp.get_app()


class ChatMessageApi(HTTPMethodView):
    @login_required
    async def post(self, request: Request):
        parser = reqparse.RequestParser()
        parser.add_argument("Contents", type=list, required=True, location="json")
        parser.add_argument("ConversationId", type=str, location="json")
        parser.add_argument("ApplicationId", type=str, location="json")
        parser.add_argument("SearchNetwork", type=bool, default=True, location="json")
        parser.add_argument("CustomVariables", type=dict, default={}, location="json")
        args = parser.parse_args(request)
        logging.info(f"ChatMessageApi: {args}")

        application_id = args['ApplicationId']
        vendor_app = app.get_vendor_app(application_id)

        # 新增以下代码，就能在对话时附加额外的API参数：
        import json
        from core.account import CoreAccount
        account = await CoreAccount.get(request.ctx.db, request.ctx.account_id)
        account_third_party = await CoreAccount.get_third_party(request.ctx.db, request.ctx.account_id)
        # 注意这里的json.dumps，腾讯云ADP约定：如果值是字典，需要进行一次json编码，转换为json字符串
        # args['CustomVariables']['account'] = json.dumps({
        #     "userId": account_third_party.OpenId if account_third_party else str(account.Id),
        #     "name": account.Name if account else "",
        # })
        args['CustomVariables']['userId']= account_third_party.OpenId if account_third_party else str(account.Id)
        logging.info(f"userId: {args['CustomVariables']['userId']}")
        logging.info(f"[ChatMessageApi] ApplicationId: {application_id},\n\
            CustomVariables: {args['CustomVariables']},\n\
            vendor_app: {vendor_app}")
        logging.info(f"ChatMessageApi: {args}")
        async def streaming_fn(response):
            async for data in CoreChat.message(
                vendor_app,
                request.ctx.account_id,
                args['Contents'],
                args['ConversationId'],
                args['SearchNetwork'],
                args['CustomVariables']
            ):
                await response.write(data)
        return ResponseStream(streaming_fn, content_type='text/event-stream; charset=utf-8')


class ChatMessageListApi(HTTPMethodView):
    async def get(self, request: Request):
        parser = reqparse.RequestParser()
        parser.add_argument("ConversationId", type=str, required=False, location="args")
        parser.add_argument("LastRecordId", type=str, required=False, location="args")
        parser.add_argument("ShareId", type=str, required=False, location="args")
        args = parser.parse_args(request)

        if args["ConversationId"] is not None:
            check_login(request)
            application_id = await CoreConversation.get_application_id(
                request.ctx.db,
                request.ctx.account_id,
                args['ConversationId']
            )
            vendor_app = app.get_vendor_app(application_id)

            records = await vendor_app.get_messages(
                request.ctx.db,
                request.ctx.account_id,
                args['ConversationId'],
                app.config.CHAT_MESSAGE_PAGE_SIZE,
                args['LastRecordId']
            )
            resp = {
                'Response': {
                    'ApplicationId': application_id,
                    'Records': [r.model_dump(exclude_none=True) for r in records],
                }
            }
            return sanic.json(resp)

        if args["ShareId"] is not None:
            if args['LastRecordId'] is not None:
                # temporarily disable pagination loading for the share API
                result = []
            else:
                conversation = await CoreShareConversation.list(request.ctx.db, args["ShareId"])
                result = conversation.to_dict()
            return sanic.json({"Response": result})

        raise SanicException('ConversationId or ShareId is required')


class ChatConversationListApi(HTTPMethodView):
    @login_required
    async def get(self, request: Request):
        conversations = await CoreConversation.list(request.ctx.db, request.ctx.account_id)
        return sanic.json([conversation.to_dict() for conversation in conversations])


class ChatConversationDeleteApi(HTTPMethodView):
    @login_required
    async def post(self, request: Request):
        parser = reqparse.RequestParser()
        parser.add_argument("ConversationId", type=str, required=True, location="json")
        args = parser.parse_args(request)

        await CoreConversation.delete(request.ctx.db, request.ctx.account_id, args["ConversationId"])
        return sanic.json({"Success": 1})


app.add_route(ChatMessageApi.as_view(), "/chat/message")
app.add_route(ChatMessageListApi.as_view(), "/chat/messages")
app.add_route(ChatConversationListApi.as_view(), "/chat/conversations")
app.add_route(ChatConversationDeleteApi.as_view(), "/chat/conversation/delete")
