// import Versions from './components/Versions'
// import icons from './assets/icons.svg'
import React, { useState, useEffect } from 'react'
import { SettingOutlined, PictureOutlined, MinusOutlined, CloseOutlined } from '@ant-design/icons'
import { Button, Space, Input, Modal, Slider } from 'antd'
const { ipcRenderer, dialog, net } = require('electron')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const axios = require('axios')
// const rimraf = require('rimraf')
// const { deleteAsync } = require('del')
// import { deleteAsync } from 'del'

let qualityNum = 90
// 创建目录
const createDirectory = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory)
  }
}
// 复制文件
const copyFile = (source, destination) => {
  fs.copyFileSync(source, destination)
}

// 函数用于创建临时文件夹
const createTempFolder = (url) => {
  const tempFolderPath = path.join(url, 'temp')

  if (!fs.existsSync(tempFolderPath)) {
    fs.mkdirSync(tempFolderPath)
  }

  return tempFolderPath
}

const replaceImage = (originalImagePath, compressedImagePath, destination) => {
  fs.rename(compressedImagePath, originalImagePath, (err) => {
    if (err) {
      console.error('替换图片失败:', err)
    } else {
      console.log('替换图片成功!')
      // removeTempFolder(compressedImagePath, destination)
      let tempFolderPath = path.join(destination, 'temp')
      let imgLen = countImagesInDirectory(tempFolderPath)
      console.log(imgLen, 'imgLen11')
      console.log(tempFolderPath, 'tempFolderPath')
      if (imgLen <= 0) {
        console.log('准备删除文件了')
        fs.rmdir(tempFolderPath, { recursive: true }, (err) => {
          if (err) {
            console.error(err)
            return
          }
          console.log('文件夹已成功删除')
        })
      }
    }
  })
}

// 函数用于删除临时文件夹
const removeTempFolder = async (compressedImagePath, destination) => {
  let tempFilePath = ''
  tempFilePath = path.join(compressedImagePath)

  fs.unlink(tempFilePath, (err) => {
    if (err) throw err
    console.log('文件删除成功')
    let tempFolderPath = path.join(destination, 'temp')
    let imgLen = countImagesInDirectory(tempFolderPath)
    console.log(tempFolderPath, 'tempFolderPath')
    console.log(imgLen, 'imgLen11')
    if (imgLen <= 0) {
      fs.unlinkSync(tempFolderPath)
    }
  })
  // const deletedFilePaths = await deleteAsync(tempFolderPath)
  // console.log(deletedFilePaths, 'deletedFilePaths')
  // deleteAsync(tempFolderPath, {
  //   onProgress: (err) => {
  //     if (err) {
  //       console.error('删除临时文件夹失败:', err)
  //     } else {
  //       console.log('临时文件夹删除成功!')
  //     }
  //   }
  // })
}
// 压缩图片
const compressImage = async (source, destination, file) => {
  let tempUrl = createTempFolder(destination)
  let tempFile = path.join(tempUrl, file)
  console.log(tempUrl, 'tempUrl')
  const fileFormat = path.extname(source)
  let sharpImg = sharp(source)
  let sharpImgQuality = ''
  switch (fileFormat) {
    case '.png':
      sharpImgQuality = sharpImg.png({ quality: qualityNum })
      break
    case '.jpg':
      sharpImgQuality = sharpImg.jpeg({ quality: qualityNum })
      break
    case '.jpeg':
      sharpImgQuality = sharpImg.jpeg({ quality: qualityNum })
      break
    default:
      // eslint-disable-next-line no-unused-vars
      sharpImgQuality = sharpImg
  }
  await sharpImgQuality.toFile(tempFile)
  replaceImage(source, tempFile, destination)
}

//获取图片张数;
const countImagesInDirectory = (directory) => {
  let imageCount = 0
  // 读取目录中的所有文件和文件夹
  const files = fs.readdirSync(directory)
  // 遍历每个文件
  files.forEach((file) => {
    // 获取文件的完整路径
    const filePath = path.join(directory, file)

    // 检查文件的扩展名是否为图片格式（此处仅考虑了常见的图片格式，您可以根据需求添加或修改）
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].some(
      (ext) => path.extname(filePath).toLowerCase() === ext
    )

    // 如果文件是图片，则增加计数
    if (isImage) {
      imageCount++
    }

    // 如果文件是目录，则递归调用自身以处理子目录
    // if (fs.statSync(filePath).isDirectory()) {
    //   imageCount += countImagesInDirectory(filePath)
    // }
  })

  return imageCount
}

const isOriginalImg = (directory) => {
  let originalImgPath = path.join(directory, 'originalImg')
  if (fs.existsSync(originalImgPath)) {
    return true
  }
  return false
}

// 遍历目录
const traverseDirectory = (directory) => {
  let imgLen = countImagesInDirectory(directory)
  let newOriginalImgFile = path.join(directory, 'originalImg')
  if (imgLen > 0) {
    if (imgLen > 0 && !isOriginalImg(directory)) {
      createDirectory(newOriginalImgFile)
      fs.readdirSync(directory).forEach((file) => {
        const filePath = path.join(directory, file)
        const stats = fs.statSync(filePath)
        console.log(file, 'file')
        console.log(filePath, 'filePath')
        console.log(stats, 'stats')
        console.log(stats.isDirectory(), 'stats.isDirectory()')
        console.log(stats.isFile(), 'stats.isFile()')
        // if (stats.isDirectory() && file !== 'originalImg') {
        //   console.log('test')
        //   const newDestinationDirectory = path.join(directory, file)
        //   traverseDirectory(newDestinationDirectory)
        //   // console.log(newDestinationDirectory, 'newDestinationDirectory')
        // } else

        if (stats.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(file)) {
          // const newOriginalImgFile = path.join(directory, 'originalImg')
          // if (!fs.existsSync(directory)) {
          //   console.log(222)
          //   createDirectory(newOriginalImgFile)
          // }
          const destination = path.join(directory, 'originalImg', file)
          copyFile(filePath, destination)
          // compressImage(filePath, directory)
        }
      })
    } else if (imgLen > 0 && isOriginalImg(directory)) {
      fs.readdirSync(newOriginalImgFile).forEach((file) => {
        const filePath = path.join(directory, file)
        const stats = fs.statSync(filePath)
        console.log(file, 'file')
        console.log(filePath, 'filePath')
        console.log(stats, 'stats')
        console.log(stats.isDirectory(), 'stats.isDirectory()')
        console.log(stats.isFile(), 'stats.isFile()')

        if (stats.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(file)) {
          const destination = path.join(directory, file)
          copyFile(filePath, destination)
        }
      })
    }

    // let originalImgLen = countImagesInDirectory(newOriginalImgFile)
    // if (imgLen !== originalImgLen) {
    //   console.log(111)
    //   fs.readdirSync(directory).forEach((file) => {
    //     const filePath = path.join(directory, file)
    //     const stats = fs.statSync(filePath)
    //     console.log(file, 'file')
    //     console.log(filePath, 'filePath')
    //     console.log(stats, 'stats')
    //     console.log(stats.isDirectory(), 'stats.isDirectory()')
    //     console.log(stats.isFile(), 'stats.isFile()')
    //     // if (stats.isDirectory() && file !== 'originalImg') {
    //     //   console.log('test')
    //     //   const newDestinationDirectory = path.join(directory, file)
    //     //   traverseDirectory(newDestinationDirectory)
    //     //   // console.log(newDestinationDirectory, 'newDestinationDirectory')
    //     // } else

    //     if (stats.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(file)) {
    //       // const newOriginalImgFile = path.join(directory, 'originalImg')
    //       // if (!fs.existsSync(directory)) {
    //       //   console.log(222)
    //       //   createDirectory(newOriginalImgFile)
    //       // }
    //       const destination = path.join(directory, 'originalImg', file)
    //       copyFile(filePath, destination)
    //       // compressImage(filePath, directory)
    //     }
    //   })
    // }
  }

  fs.readdirSync(directory).forEach((file) => {
    const filePath = path.join(directory, file)
    const stats = fs.statSync(filePath)
    console.log(filePath, 'filePath')
    console.log(stats, 'stats')
    if (stats.isDirectory() && file !== 'originalImg') {
      // const newDestinationDirectory = path.join(directory, file)
      // console.log(newDestinationDirectory, 'newDestinationDirectory')
      console.log(filePath, 'filePath  开始递归了')
      traverseDirectory(filePath)
    } else if (stats.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(file)) {
      compressImage(filePath, directory, file)
    }
  })

  // fs.readdirSync(directory).forEach((file) => {
  //   const filePath = path.join(directory, file)
  //   const stats = fs.statSync(filePath)
  //   console.log(filePath, 'filePath')
  //   console.log(stats, 'stats')
  //   if (stats.isDirectory()) {
  //     const newDestinationDirectory = path.join(directory, file)
  //     console.log(newDestinationDirectory, 'newDestinationDirectory')
  //   } else if (stats.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(file)) {
  //     const newOriginalImgFile = path.join(directory, 'originalImg')
  //     if (!fs.existsSync(directory)) {
  //       console.log(222)
  //       createDirectory(newOriginalImgFile)
  //     }
  //     const destination = path.join(directory, 'originalImg', file)
  //     copyFile(filePath, destination)
  //   }
  //   // if (stats.isDirectory()) {
  //   //   const newDestinationDirectory = path.join(destinationDirectory, file)
  //   //   createDirectory(newDestinationDirectory)
  //   //   traverseDirectory(filePath, newDestinationDirectory)
  //   // } else if (stats.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(file)) {
  //   //   const destination = path.join(destinationDirectory, file)
  //   //   copyFile(filePath, destination)
  //   //   const compressedDestination = path.join(destinationDirectory, 'compressed', file)
  //   //   compressImage(filePath, compressedDestination)
  //   // }
  // })
}

const fateGear = (url) => {
  const directory = url // 当前目录
  const destinationDirectory = path.join(directory)
  // const destinationDirectory = path.join(directory, 'originalImg')
  // createDirectory(destinationDirectory)
  // createDirectory(path.join(destinationDirectory, 'compressed'))
  console.log(destinationDirectory, 'destinationDirectory')
  traverseDirectory(destinationDirectory)
}

function App() {
  const [modal, contextHolder] = Modal.useModal()

  const [imgCompressPath, setImgCompressPath] = useState('')
  const [quality, setQuality] = useState(90)
  const [imgBg, setImgBg] = useState('')

  const getBg = () => {
    axios
      .get('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=en-US')
      .then((response) => {
        console.log(response.data)
        let imagesArr = response.data.images
        // 在这里可以对响应数据进行处理
        const randomNumber = Math.floor(Math.random() * imagesArr.length)
        console.log(randomNumber)
        setImgBg(`https://cn.bing.com${imagesArr[randomNumber].url}`)
      })
      .catch((error) => {
        console.error(error)
      })
  }
  useEffect(() => {
    getBg()
  }, [])

  const countDown = (text) => {
    let secondsToGo = 5
    const instance = modal.success({
      title: '消息通知',
      content: text
    })
    const timer = setInterval(() => {
      secondsToGo -= 1
      // instance.update({
      //   content: ``
      // })
    }, 1000)
    setTimeout(() => {
      clearInterval(timer)
      instance.destroy()
    }, secondsToGo * 1000)
  }

  let handleGetFile = () => {
    ipcRenderer.send('open-file-dialog')
  }

  let handleCompressImg = () => {
    if (!imgCompressPath) {
      countDown('请设置压缩图片路径')
      return
    }
    console.log(quality, 'quality')
    fateGear(imgCompressPath)
  }

  ipcRenderer.on('select-file', (event, arg) => {
    if (arg.length > 0) {
      setImgCompressPath(arg[0])
    }
  })

  const onChange = (value) => {
    console.log('onChange: ', value)
    setQuality(value)
    qualityNum = value
  }

  let bgStyle = {
    background: `url(${imgBg}) no-repeat center center`,
    backgroundSize: '100% 100%'
  }
  let colorIco = {
    color: '#fff'
  }

  //模拟缩小事件
  let handleMinWin = () => {
    ipcRenderer.send('min-win')
  }
  //模拟关闭事件
  let handleCloseWin = () => {
    ipcRenderer.send('close-win')
  }

  const marks = {
    0: '0',
    20: '20',
    100: '100'
  }
  return (
    <>
      <div className="main" style={bgStyle}>
        {/* <Versions></Versions> */}
        {/* <Space>
        <Input placeholder="Basic usage" />
        <Button type="primary">Primary Button</Button>
      </Space> */}
        <div className="nav">
          <div className="nav-set">
            <MinusOutlined style={colorIco} onClick={handleMinWin} />
            <CloseOutlined style={colorIco} onClick={handleCloseWin} />
            {/* <n-icon color="#fff" :component="RemoveOutline" size="20" :depth="1" @click.stop="minWin"/>
            <n-icon color="#fff" :component="Close" size="20" :depth="1" @click.stop="closeWin" /> */}
          </div>
          <div className="nav-title">
            图片压缩
            {/* <span className="nav-subTitle">一键生成H5文档页</span> */}
          </div>
        </div>
        <div className="main-top">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              style={{ backgroundColor: '#fff' }}
              placeholder="压缩图片路径"
              disabled
              value={imgCompressPath}
            />
            {/* <SettingOutlined /> */}
            <Button icon={<SettingOutlined />} type="primary" onClick={handleGetFile}>
              设置路径
            </Button>
            <Button icon={<PictureOutlined />} type="primary" onClick={handleCompressImg}>
              开始图片压缩
            </Button>
          </Space.Compact>
          <div className="quality-title">压缩品质设置:</div>
          <Slider
            min={0}
            max={100}
            marks={marks}
            defaultValue={quality}
            onChange={onChange}
            tooltip={{ open: true }}
          />
        </div>
        <div className="rule-line"></div>
        {contextHolder}
      </div>
    </>
  )
}

export default App
