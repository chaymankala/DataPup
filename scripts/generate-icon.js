const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const svgPath = path.join(__dirname, '../build/icons/icon.svg')
const pngPath = path.join(__dirname, '../build/icons/icon.png')

// Create a proper icon PNG from SVG
async function generateIcon() {
  try {
    await sharp(svgPath)
      .resize(256, 256)
      .png()
      .toFile(pngPath)
    
    console.log('Icon generated successfully!')
  } catch (error) {
    console.error('Error generating icon:', error)
  }
}

generateIcon()