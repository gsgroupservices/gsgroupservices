<?php
/**
 * GS Group Services - Contact Form Handler
 * Processes quote requests with honeypot spam protection
 */

// Only accept POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: contact.html");
    exit;
}

// Configuration
$admin_email = "info@gsgroupservices.co.uk";
$from_email  = "noreply@gsgroupservices.co.uk";
$site_name   = "GS Group Services";

// Sanitize input function
function clean($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Get and sanitize form data
$name     = clean($_POST["name"] ?? "");
$email    = clean($_POST["email"] ?? "");
$phone    = clean($_POST["phone"] ?? "");
$service  = clean($_POST["service"] ?? "");
$location = clean($_POST["location"] ?? "");
$message  = clean($_POST["message"] ?? "");

// Honeypot spam check - if filled, it's a bot
$honeypot = $_POST["website"] ?? "";
if (!empty($honeypot)) {
    // Silently redirect bots to thank you page (don't alert them)
    header("Location: thank-you.html");
    exit;
}

// Basic validation
if (empty($name) || empty($email) || empty($phone) || empty($service)) {
    // Redirect back with error (you could add error handling)
    header("Location: contact.html?error=missing");
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header("Location: contact.html?error=email");
    exit;
}

// Build email to admin
$subject = "New Quote Request – " . $service;

$body = "
===========================================
NEW QUOTE REQUEST FROM WEBSITE
===========================================

Name:     $name
Email:    $email
Phone:    $phone
Service:  $service
Location: $location

Project Details:
$message

===========================================
Sent from: gsgroupservices.co.uk
";

$headers  = "From: $site_name <$from_email>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Send email to admin
$mail_sent = mail($admin_email, $subject, $body, $headers);

// Auto-reply to customer
$reply_subject = "We received your quote request – GS Group Services";
$reply_body = "
Hi $name,

Thank you for contacting GS Group Services.

We have received your request for: $service

Our team will review your requirements and contact you within 24 hours.

If your project is urgent, please call us directly:
📞 Phone: 07440 184221
💬 WhatsApp: https://wa.me/447440184221

Your request details:
- Service: $service
- Location: $location

Kind regards,
GS Group Services

---
Website: https://gsgroupservices.co.uk
Email: info@gsgroupservices.co.uk
Phone: 07440 184221
";

$reply_headers  = "From: $site_name <$from_email>\r\n";
$reply_headers .= "Reply-To: $admin_email\r\n";
$reply_headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send auto-reply
mail($email, $reply_subject, $reply_body, $reply_headers);

// Redirect to thank you page
header("Location: thank-you.html");
exit;
