# Stripe Integration Setup

This guide covers setting up Stripe payments for the RecommendUsUK marketplace using Docker containers.

## 🚀 Quick Start (Development)

For immediate development and testing without real Stripe credentials:

```bash
# Start development with Stripe Mock
./scripts/dev-with-stripe.sh
```

This will:
- Start Stripe Mock server on port 12111
- Update .env.local with mock credentials
- Start Next.js development server
- Provide test card numbers for payments

## 🏗️ Production Setup

### 1. Get Stripe Credentials

1. Sign up at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Copy your publishable key (pk_test_...) and secret key (sk_test_...)

### 2. Update Environment Variables

```bash
# Update .env.local with your real Stripe keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Create Stripe Products

Run the setup script to create credit packages in Stripe:

```bash
export STRIPE_API_KEY=sk_test_your_secret_key_here
./scripts/setup-stripe.sh
```

This creates:
- 10 Credits (£5.00)
- 25 Credits (£10.00) - Most Popular
- 50 Credits (£18.00) - 10% savings
- 100 Credits (£32.00) - 20% savings

### 4. Configure Webhooks

1. In Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe-webhook`
3. Select events: `checkout.session.completed`, `payment_intent.payment_failed`
4. Copy the webhook secret to your .env.local

## 🐳 Docker Services

### Available Services

```bash
# Start Stripe Mock for testing
docker-compose -f docker-compose.stripe.yml up stripe-mock

# Start webhook forwarding (requires authentication)
docker-compose -f docker-compose.stripe.yml --profile webhook up stripe-cli

# Start MCP Stripe server (requires API key)
STRIPE_API_KEY=your_key docker-compose -f docker-compose.stripe.yml --profile mcp up mcp-stripe
```

### Stripe CLI Commands

```bash
# Create a product
docker run --rm -e STRIPE_API_KEY=your_key stripe/stripe-cli \
  products create --name "Test Product" --description "Test description"

# List products
docker run --rm -e STRIPE_API_KEY=your_key stripe/stripe-cli \
  products list

# Forward webhooks to local development
docker run --rm --network host -e STRIPE_API_KEY=your_key stripe/stripe-cli \
  listen --forward-to localhost:3001/api/stripe-webhook
```

## 🧪 Testing

### Test Cards

Use these test card numbers in development:

- **Successful payment**: `4242424242424242`
- **Card declined**: `4000000000000002`
- **Requires SCA**: `4000002500003155`
- **Insufficient funds**: `4000000000009995`

### Mock Environment

When using Stripe Mock:
- All payments will simulate success
- No real money is charged
- Webhooks can be tested locally
- API responses match real Stripe format

### Local Testing Flow

1. Start mock environment: `./scripts/dev-with-stripe.sh`
2. Navigate to `/buy-credits`
3. Select a credit package
4. Use test card `4242424242424242`
5. Complete purchase and verify credits are added

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint secret | Yes |
| `STRIPE_API_BASE` | Custom API base (for mock) | No |
| `STRIPE_PRICE_CREDITS_10` | Price ID for 10 credits | No |
| `STRIPE_PRICE_CREDITS_25` | Price ID for 25 credits | No |
| `STRIPE_PRICE_CREDITS_50` | Price ID for 50 credits | No |
| `STRIPE_PRICE_CREDITS_100` | Price ID for 100 credits | No |

### Price Configuration

Update `src/lib/stripe.ts` with your actual Stripe price IDs after running the setup script.

## 🚨 Security Notes

- Never commit real API keys to version control
- Use test keys during development
- Set up proper webhook endpoint verification
- Validate webhook signatures
- Use HTTPS in production

## 📱 Features

- **Credit Packages**: Multiple tiers with bulk discounts
- **Secure Checkout**: Stripe-hosted payment pages
- **Webhook Handling**: Automatic credit addition
- **Payment Verification**: Server-side verification
- **Error Handling**: Comprehensive error handling
- **Test Mode**: Full mock environment for development

## 🎯 Next Steps

1. Test the complete payment flow
2. Set up production webhooks
3. Configure Stripe Dashboard settings
4. Add additional payment methods if needed
5. Set up subscription billing (future feature)

## 📞 Support

For Stripe-specific issues:
- Check [Stripe Documentation](https://stripe.com/docs)
- Use [Stripe CLI](https://stripe.com/docs/stripe-cli) for debugging
- Monitor webhook events in Stripe Dashboard