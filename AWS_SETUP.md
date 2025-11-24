# AWS Setup Instructions for AI Interview Practice

This application uses AWS services for AI-powered interview practice:
- **AWS Polly** - Text-to-Speech for AI responses
- **AWS Bedrock (Claude)** - AI conversation and interview questions
- **AWS S3** - Video recording storage

## 1. AWS Account Setup

1. Create an AWS account at https://aws.amazon.com
2. Set up IAM user with appropriate permissions
3. Create an S3 bucket for storing interview videos

## 2. Required AWS Services

### AWS Polly
- Used for converting AI text responses to natural speech
- Neural voices provide high-quality speech synthesis
- Default voice: Joanna (can be changed)

### AWS Bedrock
- Uses Anthropic Claude 3.5 Sonnet for intelligent interview questions
- Provides contextual follow-up questions based on user responses
- Requires access to Bedrock service in your AWS region

### AWS S3
- Stores video recordings of interview sessions
- Videos are stored with presigned URLs for secure access
- Recommended bucket structure: `interviews/{userId}/{sessionId}.webm`

## 3. IAM Policy

Create an IAM policy with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/interviews/*"
    }
  ]
}
```

## 4. Environment Variables

Add the following to your `.env.local` file:

```env
# AWS Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=jobdance-interviews-1763988395

# Optional: Change Polly voice
AWS_POLLY_VOICE_ID=Joanna
```

**Note:** The S3 bucket `jobdance-interviews-1763988395` has been created in `ap-southeast-1` region.

## 5. S3 Bucket Setup

1. Create an S3 bucket in your AWS console
2. Enable CORS for the bucket (if needed for direct uploads):
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

3. Set bucket policy for secure access (adjust as needed)

## 6. Bedrock Model Access

1. Go to AWS Bedrock console
2. Request access to Anthropic Claude models
3. Wait for approval (usually instant for Claude 3.5 Sonnet)
4. Verify model access in the console

## 7. Cost Considerations

- **Polly**: ~$4 per 1M characters (neural voices)
- **Bedrock Claude 3.5 Sonnet**: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- **S3**: ~$0.023 per GB storage, ~$0.005 per 1,000 PUT requests

For development, consider using:
- Claude 3 Haiku (faster/cheaper) - change model ID in `lib/aws.ts`
- Standard Polly voices (cheaper than neural)

## 8. Testing

1. Start the development server: `npm run dev`
2. Navigate to the interview page
3. Start an interview session
4. Verify:
   - AI speaks questions (check browser console for errors)
   - AI responses are contextual and relevant
   - Video recording works
   - Video uploads to S3 successfully

## Troubleshooting

- **Polly errors**: Check IAM permissions and region settings
- **Bedrock errors**: Verify model access and region availability
- **S3 upload errors**: Check bucket name, permissions, and CORS settings
- **Audio not playing**: Check browser console for API errors

## Security Notes

- Never commit AWS credentials to version control
- Use environment variables for all AWS credentials
- Consider using AWS IAM roles for production (instead of access keys)
- Implement proper authentication for API routes in production

