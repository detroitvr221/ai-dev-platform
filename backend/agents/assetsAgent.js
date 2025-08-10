import { BaseAgent } from './baseAgent.js';

export class AssetsAgent extends BaseAgent {
  constructor({ systemPrompt, model }) {
    super({
      name: 'assets',
      role: 'Creative Asset & Branding Master',
      systemPrompt,
      model
    });
  }

  async generateAssets(projectContext, assetRequirements) {
    const message = `Generate creative assets for the following project requirements:
    
Project Context: ${JSON.stringify(projectContext, null, 2)}

Asset Requirements: ${JSON.stringify(assetRequirements, null, 2)}

Please create:
1. Visual assets (icons, images, illustrations)
2. Branding materials (logos, color schemes, typography)
3. Design system components
4. CSS animations and micro-interactions
5. Responsive design patterns

Focus on creating assets that enhance user experience and maintain brand consistency.`;

    return await this.sendMessage(message, projectContext);
  }

  async createDesignSystem(projectContext, designRequirements) {
    const message = `Create a comprehensive design system for the project:
    
Project Context: ${JSON.stringify(projectContext, null, 2)}

Design Requirements: ${JSON.stringify(designRequirements, null, 2)}

Include:
1. Color palette with primary, secondary, and accent colors
2. Typography scale and font hierarchy
3. Spacing system and layout grids
4. Component patterns and variations
5. Animation guidelines and timing
6. Accessibility considerations
7. Responsive breakpoints and mobile-first approach

Ensure the design system is scalable, accessible, and follows modern design principles.`;

    return await this.sendMessage(message, projectContext);
  }

  async generateBranding(projectContext, brandRequirements) {
    const message = `Create comprehensive branding materials for the project:
    
Project Context: ${JSON.stringify(projectContext, null, 2)}

Brand Requirements: ${JSON.stringify(brandRequirements, null, 2)}

Generate:
1. Logo variations and usage guidelines
2. Brand color palette and typography
3. Visual identity elements and patterns
4. Brand voice and messaging guidelines
5. Marketing materials and templates
6. Social media assets and guidelines
7. Print and digital asset specifications

Focus on creating a cohesive, memorable brand identity that resonates with the target audience.`;

    return await this.sendMessage(message, projectContext);
  }

  async createAnimations(projectContext, animationRequirements) {
    const message = `Create engaging animations and micro-interactions for the project:
    
Project Context: ${JSON.stringify(projectContext, null, 2)}

Animation Requirements: ${JSON.stringify(animationRequirements, null, 2)}

Include:
1. CSS keyframe animations
2. Hover effects and transitions
3. Loading animations and spinners
4. Page transitions and navigation effects
5. Interactive feedback animations
6. Performance-optimized animations
7. Accessibility considerations for motion

Ensure animations enhance user experience without being distracting or causing motion sickness.`;

    return await this.sendMessage(message, projectContext);
  }

  async optimizeAssets(projectContext, optimizationRequirements) {
    const message = `Optimize assets for web performance and accessibility:
    
Project Context: ${JSON.stringify(projectContext, null, 2)}

Optimization Requirements: ${JSON.stringify(optimizationRequirements, null, 2)}

Focus on:
1. Image compression and format optimization
2. SVG optimization and minification
3. Font loading optimization
4. CSS and JavaScript minification
5. Asset caching strategies
6. Progressive enhancement approaches
7. Performance monitoring and metrics

Ensure all assets are optimized for fast loading times and excellent user experience across all devices.`;

    return await this.sendMessage(message, projectContext);
  }
}
