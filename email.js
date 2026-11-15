
const SERVICE_ID = "service_3b56nxg";
const TEMPLATE_ID = "template_wmpj7on";
const PUBLIC_KEY = "I2UJVvOaWKWQT20PF";

export async function sendLifeLinkEmail(
    toEmail,
    message,
    requestId
) {
    try {
        const response = await fetch(
            "https://api.emailjs.com/api/v1.0/email/send",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    service_id: SERVICE_ID,
                    template_id: TEMPLATE_ID,
                    user_id: PUBLIC_KEY,
                    template_params: {
                        to_email: toEmail,
                        message: message,
                        request_id: requestId
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        console.log("Email sent successfully!");

    } catch (error) {
        console.error("Email sending failed:", error);
    }
}
