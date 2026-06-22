import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
const prisma = new PrismaClient()

async function main(){
  // create an admin user with hashed password
  const hashed = await bcrypt.hash('Password123!', 10)
  await prisma.user.upsert({
    where: { email: 'admin@veluragifts.test' },
    update: {},
    create: {
      email: 'admin@veluragifts.test',
      password: hashed,
      name: 'Admin',
      role: 'admin'
    }
  })

  // sample product (no real GLB included) — replace url with a real GLB in MinIO or S3
  const prod = await prisma.product.upsert({
    where: { slug: 'sample-product' },
    update: {},
    create: {
      title: 'Sample Gift Model',
      description: 'A sample product to test the 3D viewer. Replace with your GLB URL.',
      priceCents: 1999,
      slug: 'sample-product'
    }
  })

  await prisma.modelAsset.create({
    data: {
      productId: prod.id,
      url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      format: 'glb',
      main: true
    }
  })

  console.log('Seed complete')
}

main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=>process.exit())
