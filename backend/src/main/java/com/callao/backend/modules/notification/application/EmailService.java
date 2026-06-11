package com.callao.backend.modules.notification.application;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.UserCredentials;

import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

	private static final Logger LOGGER = LoggerFactory.getLogger(EmailService.class);

	private final String clientId;
	private final String clientSecret;
	private final String refreshToken;
	private final String sender;

	public EmailService(
		@Value("${app.gmail-api.client-id:}") String clientId,
		@Value("${app.gmail-api.client-secret:}") String clientSecret,
		@Value("${app.gmail-api.refresh-token:}") String refreshToken,
		@Value("${app.gmail-api.sender:}") String sender
	) {
		this.clientId = clean(clientId);
		this.clientSecret = clean(clientSecret);
		this.refreshToken = clean(refreshToken);
		this.sender = clean(sender);
	}

	public boolean sendWelcomeEmail(WelcomeEmail email) {
		String html = buildWelcomeTemplate(email);

		if (!isConfigured()) {
			LOGGER.warn(
				"""
				Correo no enviado porque Gmail API no esta configurado.
				Para: {}
				Asunto: {}
				DNI: {}
				Contrasena temporal: {}
				""",
				email.to(),
				subject(),
				email.dni(),
				email.temporaryPassword()
			);
			return false;
		}

		try {
			UserCredentials credentials = UserCredentials.newBuilder()
				.setClientId(clientId)
				.setClientSecret(clientSecret)
				.setRefreshToken(refreshToken)
				.build();

			Gmail service = new Gmail.Builder(
					GoogleNetHttpTransport.newTrustedTransport(),
					GsonFactory.getDefaultInstance(),
					new HttpCredentialsAdapter(credentials))
				.setApplicationName("Callao Backend")
				.build();

			Properties props = new Properties();
			Session session = Session.getDefaultInstance(props, null);
			MimeMessage mimeMessage = new MimeMessage(session);

			mimeMessage.setFrom(new InternetAddress(sender));
			mimeMessage.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(email.to()));
			mimeMessage.setSubject(subject(), "UTF-8");
			mimeMessage.setContent(html, "text/html; charset=utf-8");

			ByteArrayOutputStream buffer = new ByteArrayOutputStream();
			mimeMessage.writeTo(buffer);
			byte[] rawMessageBytes = buffer.toByteArray();
			String encodedEmail = Base64.getUrlEncoder().encodeToString(rawMessageBytes);

			Message message = new Message();
			message.setRaw(encodedEmail);

			service.users().messages().send("me", message).execute();
			return true;
		} catch (Exception exception) {
			LOGGER.error("Error enviando correo con Gmail API", exception);
			throw new EmailDeliveryException("No se pudo enviar el correo de credenciales mediante la API de Gmail.", exception);
		}
	}

	private boolean isConfigured() {
		return !clientId.isBlank() && !clientSecret.isBlank() && !refreshToken.isBlank() && !sender.isBlank();
	}

	private String subject() {
		return "Acceso creado - Sistema de Control de Acceso GORE Callao";
	}

	private String buildWelcomeTemplate(WelcomeEmail email) {
		return """
			<div style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;color:#1d2636;">
			  <div style="max-width:620px;margin:0 auto;padding:28px 16px;">
			    <div style="background:#fff;border:1px solid #dfe5ef;border-radius:10px;overflow:hidden;">
			      <div style="padding:30px 28px;text-align:center;border-bottom:1px solid #e4e8f0;">
			        <div style="display:inline-block;padding:14px 18px;border-radius:8px;background:#00346f;color:#fff;font-size:24px;font-weight:800;letter-spacing:.03em;">GORE CALLAO</div>
			        <p style="margin:12px 0 0;color:#5d6370;">Sistema de Control de Acceso</p>
			      </div>
			      <div style="padding:30px 34px;">
			        <h1 style="margin:0 0 14px;font-size:24px;color:#001b3f;">Hola, %s</h1>
			        <p style="margin:0 0 18px;line-height:1.6;">Tu usuario fue creado correctamente en la plataforma. Se te asigno el rol <strong>%s</strong>.</p>
			        <div style="border:1px solid #b7c8e6;background:#f3f7ff;border-radius:8px;padding:18px;margin:22px 0;">
			          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#5d6370;letter-spacing:.08em;text-transform:uppercase;">Credenciales temporales</p>
			          <p style="margin:0 0 8px;"><strong>DNI:</strong> %s</p>
			          <p style="margin:0;"><strong>Contrasena temporal:</strong> %s</p>
			        </div>
			        <p style="margin:0 0 16px;line-height:1.6;">Al iniciar sesion por primera vez, el sistema te solicitara cambiar esta contrasena de forma obligatoria.</p>
			        <p style="margin:0;color:#6b7280;font-size:13px;">Si no esperabas este correo, comunicate con el administrador del sistema.</p>
			      </div>
			      <div style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e4e8f0;text-align:center;color:#7a818d;font-size:12px;">
			        Gobierno Regional del Callao - Plataforma de supervision y evaluacion
			      </div>
			    </div>
			  </div>
			</div>
			""".formatted(
				escape(email.nombres()),
				escape(email.rolNombre()),
				escape(email.dni()),
				escape(email.temporaryPassword())
			);
	}

	private String escape(String value) {
		return value == null ? "" : value
			.replace("&", "&amp;")
			.replace("<", "&lt;")
			.replace(">", "&gt;")
			.replace("\"", "&quot;");
	}

	private String clean(String value) {
		return value == null ? "" : value.trim();
	}

	public record WelcomeEmail(
		String to,
		String nombres,
		String rolNombre,
		String dni,
		String temporaryPassword
	) {
	}
}
