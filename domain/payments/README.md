# Serviço de Pagamentos

Serviço agnóstico de pagamentos que suporta múltiplos providers de integração. Atualmente suporta Stripe, com arquitetura preparada para adicionar novos providers (PayPal, MercadoPago, etc.) sem grandes alterações.

## Arquitetura

O serviço está separado em camadas:

- **Types** (`types.ts`): Definições de tipos e interfaces
- **Providers** (`providers/`): Implementações específicas de cada provider
  - `stripe.provider.ts`: Implementação do Stripe
  - `payment-provider.interface.ts`: Interface base que todos os providers devem implementar
- **Repository** (`payments.repository.ts`): Camada de acesso ao banco de dados
- **Service** (`payments.service.ts`): Serviço agnóstico que orquestra os providers

## Instalação

Para usar o provider Stripe, instale a dependência:

```bash
npm install stripe
```

## Uso Básico

### Configuração do Provider

Cada cliente pode usar suas próprias chaves do provider:

```typescript
import PaymentsService from '@/domain/payments/payments.service';

const paymentService = new PaymentsService();

// Configuração do Stripe com as chaves do cliente
const stripeConfig = {
  provider: 'stripe' as const,
  apiKey: process.env.STRIPE_SECRET_KEY!, // Chave do cliente
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET, // Opcional, para webhooks
};
```

### Criar uma Assinatura

```typescript
const subscription = await paymentService.createSubscription(stripeConfig, {
  userId: 'user-123',
  planId: 'basic',
  currency: 'BRL',
  paymentMethodId: 'pm_1234567890', // ID do método de pagamento criado no frontend
  metadata: {
    email: 'user@example.com',
    name: 'João Silva',
  },
});

console.log(subscription.subscriptionId); // ID da subscription no Stripe
console.log(subscription.clientSecret); // Para confirmação de pagamento (se necessário)
```

### Buscar Assinatura Ativa

```typescript
const activeSubscription = await paymentService.getActiveSubscriptionByUserId('user-123');

if (activeSubscription) {
  console.log(`Plano ativo: ${activeSubscription.plan_id}`);
  console.log(`Status: ${activeSubscription.status}`);
  console.log(`Próximo pagamento: ${activeSubscription.current_period_end}`);
}
```

### Cancelar Assinatura

```typescript
// Cancelar no final do período atual
await paymentService.cancelSubscription(stripeConfig, {
  subscriptionId: '1', // ID do banco de dados
  immediately: false,
});

// Cancelar imediatamente
await paymentService.cancelSubscription(stripeConfig, {
  subscriptionId: '1',
  immediately: true,
});
```

### Atualizar Assinatura (Mudar Plano)

```typescript
await paymentService.updateSubscription(stripeConfig, {
  subscriptionId: '1', // ID do banco de dados
  planId: 'pro', // Novo plano
});
```

### Processar Webhooks

```typescript
// Em uma rota de webhook (ex: app/api/webhooks/stripe/route.ts)
import { NextRequest, NextResponse } from 'next/server';
import PaymentsService from '@/domain/payments/payments.service';

export async function POST(request: NextRequest) {
  const paymentService = new PaymentsService();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  const stripeConfig = {
    provider: 'stripe' as const,
    apiKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  };

  // Validar webhook
  const isValid = await paymentService.validateWebhook(
    stripeConfig,
    body,
    signature,
  );

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  // Processar evento
  const result = await paymentService.handleWebhook(stripeConfig, event);

  // O serviço já atualiza o banco de dados automaticamente
  // Você pode fazer ações adicionais baseadas no tipo de evento
  if (result.type === 'customer.subscription.updated') {
    console.log('Subscription updated:', result.subscription);
  }

  return NextResponse.json({ received: true });
}
```

## Adicionar Novo Provider

Para adicionar um novo provider (ex: PayPal):

1. Criar o arquivo `providers/paypal.provider.ts`
2. Implementar a interface `PaymentProviderInterface`
3. Adicionar o case no método `createProvider` do `PaymentsService`:

```typescript
case 'paypal':
  return new PayPalPaymentProvider(config);
```

O serviço e repositório permanecem inalterados!

## Estrutura do Banco de Dados

A tabela `subscriptions` armazena:
- Informações da subscription no provider
- Status atual
- Períodos de cobrança
- Metadados customizados
- Relação com usuário e plano

Execute a migração:

```bash
npm run migrate
```

## Tipos Disponíveis

Todos os tipos estão exportados em `types.ts`:

- `PaymentProvider`: 'stripe' | 'paypal' | 'mercadopago'
- `SubscriptionStatus`: Status possíveis da assinatura
- `PaymentProviderConfig`: Configuração do provider
- `CreateSubscriptionParams`: Parâmetros para criar subscription
- `Subscription`: Tipo da subscription no banco de dados
- E mais...
