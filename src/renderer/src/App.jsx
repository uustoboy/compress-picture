// import Versions from './components/Versions'
// import icons from './assets/icons.svg'
import React, { useState } from 'react'
import { SettingOutlined , PictureOutlined  } from '@ant-design/icons'
import { Button, Space, Input, Modal,Divider,Slider } from 'antd'
const { ipcRenderer, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

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

// 压缩图片
const compressImage = async (source, destination) => {
  await sharp(source).resize(800).toFile(destination)
}

// 遍历目录
const traverseDirectory = (directory) => {
  fs.readdirSync(directory).forEach((file) => {
    const filePath = path.join(directory, file)
    const stats = fs.statSync(filePath)
    console.log(filePath, 'filePath')
    console.log(stats, 'stats')

    if (stats.isDirectory()) {
      const newDestinationDirectory = path.join(directory, file)
      console.log(newDestinationDirectory, 'newDestinationDirectory')
    } else if (stats.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(file)) {
      const newOriginalImgFile = path.join(directory, 'originalImg')
      if (!fs.existsSync(directory)) {
        console.log(222)
        createDirectory(newOriginalImgFile)
      }
      const destination = path.join(directory, 'originalImg', file)
        copyFile(filePath, destination)
    }
    // if (stats.isDirectory()) {
    //   const newDestinationDirectory = path.join(destinationDirectory, file)
    //   createDirectory(newDestinationDirectory)
    //   traverseDirectory(filePath, newDestinationDirectory)
    // } else if (stats.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(file)) {
    //   const destination = path.join(destinationDirectory, file)
    //   copyFile(filePath, destination)
    //   const compressedDestination = path.join(destinationDirectory, 'compressed', file)
    //   compressImage(filePath, compressedDestination)
    // }
  })
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
  const [quality,setQuality] = useState(90)
  

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

  let handleCompressImg = ()=>{
    if( !imgCompressPath ){
      countDown('请设置压缩图片路径');
      return;
    }
    console.log(quality,'quality')
    // fateGear(imgCompressPath)
  }

  ipcRenderer.on('select-file', (event, arg) => {
    if (arg.length > 0) {
      setImgCompressPath(arg[0])
    }
  })

  const onChange = (value) => {
    console.log('onChange: ', value);
    setQuality(value);
  };
  
  return (
    <>
      {/* <Versions></Versions> */}
      {/* <Space>
        <Input placeholder="Basic usage" />
        <Button type="primary">Primary Button</Button>
      </Space> */}
      <Space.Compact style={{ width: '100%' }}>
        <Input placeholder='压缩图片路径' disabled value={imgCompressPath} />
        {/* <SettingOutlined /> */}
        <Button icon={<SettingOutlined />} type="primary" onClick={handleGetFile}>
          设置路径
        </Button>
        <Button icon={<PictureOutlined />} type="primary" onClick={handleCompressImg}>
          开始图片压缩
        </Button>
      </Space.Compact>
      <Slider defaultValue={quality} onChange={onChange}  tooltip={{ open: true }} />
      <Divider plain></Divider>
      {contextHolder}
    </>
  )
}

export default App
