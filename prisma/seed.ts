import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      image: '/categories/electronics.jpg',
    },
  })

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      image: '/categories/clothing.jpg',
    },
  })

  const homeGarden = await prisma.category.upsert({
    where: { slug: 'home-garden' },
    update: {},
    create: {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home improvement and garden supplies',
      image: '/categories/home-garden.jpg',
    },
  })

  const sports = await prisma.category.upsert({
    where: { slug: 'sports' },
    update: {},
    create: {
      name: 'Sports',
      slug: 'sports',
      description: 'Sports equipment and fitness gear',
      image: '/categories/sports.jpg',
    },
  })

  // Create brands
  const techBrand = await prisma.brand.upsert({
    where: { slug: 'techbrand' },
    update: {},
    create: {
      name: 'TechBrand',
      slug: 'techbrand',
      description: 'Premium technology products',
      website: 'https://techbrand.com',
    },
  })

  const fashionCo = await prisma.brand.upsert({
    where: { slug: 'fashionco' },
    update: {},
    create: {
      name: 'FashionCo',
      slug: 'fashionco',
      description: 'Modern fashion and lifestyle',
      website: 'https://fashionco.com',
    },
  })

  const fitTech = await prisma.brand.upsert({
    where: { slug: 'fittech' },
    update: {},
    create: {
      name: 'FitTech',
      slug: 'fittech',
      description: 'Fitness and wellness technology',
      website: 'https://fittech.com',
    },
  })

  // Create products
  const headphones = await prisma.product.upsert({
    where: { slug: 'wireless-bluetooth-headphones' },
    update: {},
    create: {
      name: 'Wireless Bluetooth Headphones',
      slug: 'wireless-bluetooth-headphones',
      description: 'Premium wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals who demand high-quality audio.',
      shortDescription: 'Premium wireless headphones with noise cancellation',
      basePrice: 79.99,
      salePrice: 59.99,
      sku: 'WBH-001',
      stock: 15,
      categoryId: electronics.id,
      brandId: techBrand.id,
      isFeatured: true,
      images: {
        create: [
          {
            url: '/placeholder.svg?height=400&width=400',
            altText: 'Wireless Bluetooth Headphones - Front View',
            sortOrder: 0,
            isMain: true,
          },
          {
            url: '/placeholder.svg?height=400&width=400',
            altText: 'Wireless Bluetooth Headphones - Side View',
            sortOrder: 1,
            isMain: false,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Black',
            attributes: '{"color": "black"}',
            stock: 10,
          },
          {
            name: 'White',
            attributes: '{"color": "white"}',
            stock: 5,
          },
        ],
      },
    },
  })

  const tshirt = await prisma.product.upsert({
    where: { slug: 'premium-cotton-t-shirt' },
    update: {},
    create: {
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-t-shirt',
      description: 'Soft, comfortable cotton t-shirt perfect for everyday wear. Made from 100% organic cotton with a modern fit.',
      shortDescription: 'Soft, comfortable cotton t-shirt',
      basePrice: 29.99,
      sku: 'PCT-001',
      stock: 25,
      categoryId: clothing.id,
      brandId: fashionCo.id,
      images: {
        create: [
          {
            url: '/placeholder.svg?height=400&width=400',
            altText: 'Premium Cotton T-Shirt',
            sortOrder: 0,
            isMain: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Small - Black',
            attributes: '{"size": "S", "color": "black"}',
            stock: 8,
          },
          {
            name: 'Medium - Black',
            attributes: '{"size": "M", "color": "black"}',
            stock: 10,
          },
          {
            name: 'Large - Black',
            attributes: '{"size": "L", "color": "black"}',
            stock: 7,
          },
        ],
      },
    },
  })

  const smartWatch = await prisma.product.upsert({
    where: { slug: 'smart-fitness-watch' },
    update: {},
    create: {
      name: 'Smart Fitness Watch',
      slug: 'smart-fitness-watch',
      description: 'Advanced fitness tracking with heart rate monitoring, GPS, and 7-day battery life. Track your workouts and stay connected.',
      shortDescription: 'Advanced fitness tracking smartwatch',
      basePrice: 199.99,
      salePrice: 149.99,
      sku: 'SFW-001',
      stock: 8,
      categoryId: electronics.id,
      brandId: fitTech.id,
      isFeatured: true,
      images: {
        create: [
          {
            url: '/placeholder.svg?height=400&width=400',
            altText: 'Smart Fitness Watch',
            sortOrder: 0,
            isMain: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Silver',
            attributes: '{"color": "silver"}',
            stock: 4,
          },
          {
            name: 'Black',
            attributes: '{"color": "black"}',
            stock: 4,
          },
        ],
      },
    },
  })

  const coffeeProduct = await prisma.product.upsert({
    where: { slug: 'organic-coffee-beans' },
    update: {},
    create: {
      name: 'Organic Coffee Beans',
      slug: 'organic-coffee-beans',
      description: 'Premium organic coffee beans sourced from sustainable farms. Rich, smooth flavor perfect for your morning brew.',
      shortDescription: 'Premium organic coffee beans',
      basePrice: 24.99,
      sku: 'OCB-001',
      stock: 50,
      categoryId: homeGarden.id,
      images: {
        create: [
          {
            url: '/placeholder.svg?height=400&width=400',
            altText: 'Organic Coffee Beans',
            sortOrder: 0,
            isMain: true,
          },
        ],
      },
    },
  })

  // Create a demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewX5G7mQ8l0J8KnG', // password123
      firstName: 'Demo',
      lastName: 'User',
      phone: '+91 9876543210',
      role: 'CUSTOMER',
    },
  })

  // Create demo address
  await prisma.address.upsert({
    where: { 
      userId_type: {
        userId: demoUser.id,
        type: 'SHIPPING'
      }
    },
    update: {},
    create: {
      userId: demoUser.id,
      type: 'SHIPPING',
      firstName: 'Demo',
      lastName: 'User',
      addressLine1: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'IN',
      phone: '+91 9876543210',
      isDefault: true,
    },
  })

  // Create some demo reviews
  await prisma.review.upsert({
    where: {
      productId_userId: {
        productId: headphones.id,
        userId: demoUser.id
      }
    },
    update: {},
    create: {
      productId: headphones.id,
      userId: demoUser.id,
      rating: 5,
      title: 'Excellent headphones!',
      comment: 'Amazing sound quality and comfort. The noise cancellation works perfectly.',
      isVerifiedPurchase: true,
      isApproved: true,
    },
  })

  console.log('✅ Database seeding completed successfully!')
  console.log(`
Created:
- ${electronics.name} category
- ${clothing.name} category  
- ${homeGarden.name} category
- ${sports.name} category
- ${techBrand.name} brand
- ${fashionCo.name} brand
- ${fitTech.name} brand
- ${headphones.name} product
- ${tshirt.name} product
- ${smartWatch.name} product
- ${coffeeProduct.name} product
- Demo user (demo@example.com / password123)
`)
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })