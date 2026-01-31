<?php
if ($_SERVER["REQUEST_METHOD"] !== "POST") { header("Location: contact.html"); exit; }

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php'; 
require 'PHPMailer/src/SMTP.php';

function clean($data) { return htmlspecialchars(strip_tags(trim($data))); }

$name = clean($_POST["name"] ?? "");
$email = clean($_POST["email"] ?? "");
// ... altri campi ...

if (empty($name) || empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header("Location: contact.html?error=missing"); exit;
}

// ADMIN EMAIL
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'tuo@gmail.com';        // LA TUA GMAIL
    $mail->Password = 'abcd efgh ijkl mnop';  // APP PASSWORD 16 char
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    
    $mail->setFrom('info@gsgroupservices.co.uk', 'GS Group');
    $mail->addAddress('info@gsgroupservices.co.uk');
    $mail->addReplyTo($email, $name);
    
    $mail->Subject = 'New Quote: ' . clean($_POST["service"] ?? '');
    $mail->Body = "Name: $name\nEmail: $email\n...";
    
    $mail->send();
} catch (Exception $e) {
    error_log("Mail failed: " . $mail->ErrorInfo);  // Log errore
}

// AUTOREPLY (stesso codice, cambia addAddress($email))
header("Location: thank-you.html");
?>
