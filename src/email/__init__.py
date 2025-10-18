"""
Utilities for delivering emails via the Gmail API.

This module encapsulates the OAuth2 dance and provides a small OOP-style
interface for sending plain-text emails. It mirrors the authentication
approach used by the Google Forms generator, but keeps a dedicated token file
so the Gmail scope does not collide with other saved credentials.
"""

from __future__ import annotations

import base64
import os
import pickle
from email.mime.text import MIMEText
from typing import Optional

from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


class GmailEmailSender:
    """High-level helper for sending emails using the Gmail API."""

    def __init__(
        self,
        credentials_file: str = "credentials.json",
        token_file: str = "token.gmail.pickle",
    ) -> None:
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.creds = None
        self.service = None
        self._authenticate()

    def _authenticate(self) -> None:
        """Authenticate the user and build the Gmail API service client."""
        if os.path.exists(self.token_file):
            with open(self.token_file, "rb") as token:
                self.creds = pickle.load(token)

        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, GMAIL_SCOPES
                )
                self.creds = flow.run_local_server(port=0)

            with open(self.token_file, "wb") as token:
                pickle.dump(self.creds, token)

        self.service = build("gmail", "v1", credentials=self.creds)

    def _create_message(
        self,
        recipient: str,
        subject: str,
        body: str,
        sender_name: Optional[str] = None,
    ) -> dict:
        """Create a base64-encoded message payload for the Gmail API."""
        message = MIMEText(body)
        if sender_name:
            message["From"] = sender_name
        message["To"] = recipient
        message["Subject"] = subject

        raw_bytes = base64.urlsafe_b64encode(message.as_bytes())
        return {"raw": raw_bytes.decode("utf-8")}

    def send_email(
        self,
        recipient: str,
        subject: str,
        body: str,
        sender_id: str = "me",
        sender_name: Optional[str] = None,
    ) -> str:
        """
        Send a plain-text email to the supplied recipient.

        Args:
            recipient: Email address of the recipient.
            subject: Subject line for the email.
            body: Plain-text body content.
            sender_id: Gmail identifier of the authenticated user ("me" works).
            sender_name: Optional friendly name for the From header.

        Returns:
            The Gmail API message id for the sent email.
        """
        payload = self._create_message(recipient, subject, body, sender_name)

        try:
            response = (
                self.service.users().messages().send(userId=sender_id, body=payload).execute()
            )
        except HttpError as error:
            raise Exception(f"Failed to send email via Gmail API: {error}") from error

        return response.get("id", "")
