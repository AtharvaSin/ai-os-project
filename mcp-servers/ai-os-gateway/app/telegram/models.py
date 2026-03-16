"""Pydantic v2 models for Telegram Bot API objects."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class TelegramUser(BaseModel):
    """Telegram user object."""

    model_config = ConfigDict(extra="allow")

    id: int
    is_bot: bool = False
    first_name: str
    last_name: str | None = None
    username: str | None = None
    language_code: str | None = None


class TelegramChat(BaseModel):
    """Telegram chat object."""

    model_config = ConfigDict(extra="allow")

    id: int
    type: str
    title: str | None = None
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None


class TelegramMessage(BaseModel):
    """Telegram message object."""

    model_config = ConfigDict(extra="allow")

    message_id: int
    from_user: TelegramUser | None = Field(default=None, alias="from")
    chat: TelegramChat
    date: int
    text: str | None = None
    reply_to_message: TelegramMessage | None = None


class InlineKeyboardButton(BaseModel):
    """Inline keyboard button."""

    model_config = ConfigDict(extra="allow")

    text: str
    callback_data: str | None = None
    url: str | None = None


class InlineKeyboardMarkup(BaseModel):
    """Inline keyboard markup."""

    model_config = ConfigDict(extra="allow")

    inline_keyboard: list[list[InlineKeyboardButton]]


class TelegramCallbackQuery(BaseModel):
    """Telegram callback query from inline keyboard."""

    model_config = ConfigDict(extra="allow")

    id: str
    from_user: TelegramUser = Field(alias="from")
    message: TelegramMessage | None = None
    data: str | None = None
    chat_instance: str | None = None


class TelegramUpdate(BaseModel):
    """Telegram webhook update object."""

    model_config = ConfigDict(extra="allow")

    update_id: int
    message: TelegramMessage | None = None
    callback_query: TelegramCallbackQuery | None = None
    inline_query: dict | None = None
