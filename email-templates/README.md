# Email Templates for Supabase

## Confirmation Email Template

This folder contains the email templates for Supabase's new user confirmation email.

### How to Use in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select **Confirm signup** template
4. Copy the HTML content from `confirmation-email.html` and paste it into the HTML editor
5. Copy the plain text content from `confirmation-email-plain.txt` and paste it into the Plain text editor

### Template Variables

Supabase automatically replaces these variables:
- `{{ .ConfirmationURL }}` - The confirmation link that users need to click
- `{{ .SiteURL }}` - Your site URL (configured in Supabase settings)

### Customization

- The email uses a dark theme matching JobDance.ai branding
- Colors: Blue (#2563eb) for buttons, dark slate backgrounds
- Company: ClanMe Pte Ltd
- Product: JobDance.ai

### Notes

- The HTML template uses inline CSS for maximum email client compatibility
- The template is responsive and works on mobile devices
- Links to Terms of Service and Privacy Policy are included
- The confirmation link expires in 24 hours (this is set in Supabase settings)



