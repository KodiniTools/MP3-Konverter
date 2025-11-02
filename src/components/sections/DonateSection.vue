<template>
  <section class="donate-section">
    <div class="donate-container">
      <h2 class="section-title">{{ $t('donate.title') }}</h2>
      <p class="donate-description">{{ $t('donate.description') }}</p>

      <form
        action="https://www.paypal.com/donate"
        method="post"
        target="_top"
        class="donate-form"
      >
        <input type="hidden" name="hosted_button_id" value="8RGLGQ2BFMHU6" />
        <button type="submit" class="paypal-button" title="PayPal - The safer, easier way to pay online!">
          <span class="paypal-logo">PayPal</span>
          <span class="donate-text">{{ $t('donate.buttonText') }}</span>
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<style scoped lang="scss">
.donate-section {
  padding: 3rem 1rem;
  background: linear-gradient(
    135deg,
    var(--gradient-start) 0%,
    var(--gradient-end) 100%
  );

  .donate-container {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;

    .section-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 1rem;

      @media (max-width: 768px) {
        font-size: 1.5rem;
      }
    }

    .donate-description {
      font-size: 1.1rem;
      color: var(--text-secondary);
      margin-bottom: 2rem;
      line-height: 1.6;

      @media (max-width: 768px) {
        font-size: 1rem;
      }
    }

    .donate-form {
      display: inline-block;

      .paypal-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 2rem;
        background: #0070ba;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 112, 186, 0.3);

        .paypal-logo {
          font-weight: 700;
          font-size: 1.2rem;
          letter-spacing: -0.5px;
        }

        .donate-text {
          font-weight: 500;
        }

        &:hover {
          background: #005a95;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 112, 186, 0.4);
        }

        &:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 112, 186, 0.3);
        }

        @media (max-width: 768px) {
          font-size: 1rem;
          padding: 0.65rem 1.5rem;

          .paypal-logo {
            font-size: 1.1rem;
          }
        }
      }
    }
  }
}
</style>
