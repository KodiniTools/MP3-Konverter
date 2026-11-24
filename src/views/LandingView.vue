<template>
  <!-- Landingpage (/): Bild, Nutzen und Ablauf; die Konvertierung selbst liegt unter /app/ -->
  <main id="main-content" class="landing-page">
    <HeroSection />
    <FeaturesSection />
    <HowItWorksSection />
    <OtherToolsSection />
    <FAQSection />
    <CtaSection />
  </main>
</template>

<script setup>
import HeroSection from '../components/layout/HeroSection.vue'
import FeaturesSection from '../components/sections/FeaturesSection.vue'
import HowItWorksSection from '../components/sections/HowItWorksSection.vue'
import OtherToolsSection from '../components/sections/OtherToolsSection.vue'
import FAQSection from '../components/sections/FAQSection.vue'
import CtaSection from '../components/sections/CtaSection.vue'
</script>
