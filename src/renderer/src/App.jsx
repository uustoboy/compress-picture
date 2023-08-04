// import Versions from './components/Versions'
// import icons from './assets/icons.svg'
import React, { useState } from 'react'
import { SettingOutlined } from '@ant-design/icons'
import { Button, Space, Input, Modal } from 'antd'
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

  const [imgCompressPath, setImgCompressPath] = useState('123')

  const countDown = () => {
    let secondsToGo = 5
    const instance = modal.success({
      title: '消息通知',
      content: `123`
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

  ipcRenderer.on('select-file', (event, arg) => {
    if (arg.length > 0) {
      setImgCompressPath(arg[0])
      fateGear(arg[0])
    }
  })

  return (
    <>
      {/* <Versions></Versions> */}
      {/* <Space>
        <Input placeholder="Basic usage" />
        <Button type="primary">Primary Button</Button>
      </Space> */}
      <Space.Compact style={{ width: '100%' }}>
        <Input defaultValue="请输入压缩图片地址" disabled value={imgCompressPath} />
        {/* <SettingOutlined /> */}
        <Button icon={<SettingOutlined />} type="primary" onClick={handleGetFile}>
          Submit
        </Button>
      </Space.Compact>
      {contextHolder}
    </>
  )
}

export default App
