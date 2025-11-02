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
        <input
          type="image"
          src="https://www.paypalobjects.com/de_DE/CH/i/btn/btn_donate_LG.gif"
          border="0"
          name="submit"
          title="PayPal - The safer, easier way to pay online!"
          alt="Spenden mit dem PayPal-Button"
        />
        <img
          alt=""
          border="0"
          src="https://www.paypal.com/de_CH/i/scr/pixel.gif"
          width="1"
          height="1"
        />
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

      input[type="image"] {
        transition: transform 0.2s ease, opacity 0.2s ease;
        cursor: pointer;

        &:hover {
          transform: scale(1.05);
          opacity: 0.9;
        }

        &:active {
          transform: scale(0.98);
        }
      }
    }
  }
}
</style>
