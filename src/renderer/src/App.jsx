import React, { useState, useEffect } from 'react'
import {
  SettingOutlined,
  PictureOutlined,
  MinusOutlined,
  CloseOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { Button, Space, Input, Modal, Slider, ConfigProvider, message, List, Spin } from 'antd'
const { ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const axios = require('axios')

function App() {
  const [messageApi, messageContextHolder] = message.useMessage()
  const [modal, contextHolder] = Modal.useModal()
  const [imgCompressPath, setImgCompressPath] = useState('')
  const [quality, setQuality] = useState(90)
  const [imgBg, setImgBg] = useState('')
  const [dataList, setDataList] = useState([])
  const [loading, setLoading] = useState(false)

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
    const tempFolderPath = path.join(url, 'tempFloderImg')

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
        // console.log('替换图片成功!')
        let tempFolderPath = path.join(destination, 'tempFloderImg')
        let imgLen = countImagesInDirectory(tempFolderPath)
        if (imgLen <= 0) {
          // console.log('准备删除文件了')
          fs.rmdir(tempFolderPath, { recursive: true }, (err) => {
            if (err) {
              console.error(err)
              return
            }
            // console.log('文件夹已成功删除')
          })
        }
      }
    })
  }

  const isExistOriginalImg = (originalPath, initialImg) => {
    let returnExist = false
    fs.readdirSync(originalPath).forEach((file) => {
      const filePath = path.join(originalPath, file)
      const stats = fs.statSync(filePath)
      if (stats.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(file) && initialImg == file) {
        returnExist = true
      }
    })
    return returnExist
  }

  // 函数用于删除临时文件夹
  const removeTempFolder = async (compressedImagePath, destination) => {
    let tempFilePath = ''
    tempFilePath = path.join(compressedImagePath)

    fs.unlink(tempFilePath, (err) => {
      if (err) throw err
      // console.log('文件删除成功')
      let tempFolderPath = path.join(destination, 'tempFloderImg')
      let imgLen = countImagesInDirectory(tempFolderPath)
      if (imgLen <= 0) {
        fs.unlinkSync(tempFolderPath)
      }
    })
  }
  // 压缩图片
  const compressImage = async (source, file, upFolder) => {
    let tempFile = path.join(upFolder, file)
    const fileFormat = path.extname(source)
    let sharpImg = sharp(source)
    let sharpImgQuality = ''
    switch (fileFormat) {
      case '.png':
        sharpImgQuality = sharpImg.png({ quality: quality })
        break
      case '.jpg':
        sharpImgQuality = sharpImg.jpeg({ quality: quality })
        break
      case '.jpeg':
        sharpImgQuality = sharpImg.jpeg({ quality: quality })
        break
      default:
        // eslint-disable-next-line no-unused-vars
        sharpImgQuality = sharpImg
    }
    await sharpImgQuality.toFile(tempFile)
    setDataList((prevArray) => [...prevArray, `${tempFile} 压缩完成`])
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
    })

    return imageCount
  }

  const isOriginalImg = (directory) => {
    if (fs.existsSync(directory)) {
      return true
    }
    return false
  }

  // 遍历目录
  const traverseDirectory = (directory) => {
    let imgLen = countImagesInDirectory(directory)
    let newOriginalImgFile = path.join(directory, 'originalImg')
    let originaLen = 0
    if (isOriginalImg(newOriginalImgFile)) {
      originaLen = countImagesInDirectory(newOriginalImgFile)
    }

    if (imgLen > 0 || originaLen > 0) {
      if (imgLen > 0 && !isOriginalImg(newOriginalImgFile)) {
        createDirectory(newOriginalImgFile)
        fs.readdirSync(directory).forEach((file) => {
          const filePath = path.join(directory, file)
          const stats = fs.statSync(filePath)
          if (stats.isFile() && /\.(jpg|jpeg|png|gif|bmp)$/i.test(file)) {
            const destination = path.join(directory, 'originalImg', file)
            copyFile(filePath, destination)
          }
        })
      } else if (isOriginalImg(newOriginalImgFile) && originaLen > imgLen) {
        fs.readdirSync(newOriginalImgFile).forEach((file) => {
          const filePath = path.join(newOriginalImgFile, file)
          const stats = fs.statSync(filePath)
          if (stats.isFile() && /\.(jpg|jpeg|png|gif|bmp)$/i.test(file)) {
            const destination = path.join(directory, file)
            if (!isExistOriginalImg(directory, file)) {
              copyFile(filePath, destination)
            }
          }
        })
      } else if (isOriginalImg(newOriginalImgFile) && originaLen < imgLen) {
        fs.readdirSync(directory).forEach((file) => {
          const filePath = path.join(directory, file)
          const stats = fs.statSync(filePath)
          if (stats.isFile() && /\.(jpg|jpeg|png|gif|bmp)$/i.test(file)) {
            const destination = path.join(directory, 'originalImg', file)
            if (!isExistOriginalImg(newOriginalImgFile, file)) {
              copyFile(filePath, destination)
            }
          }
        })
      }
    }
    let traverseFiles = fs.readdirSync(directory)
    traverseFiles.forEach((file) => {
      const filePath = path.join(directory, file)
      const stats = fs.statSync(filePath)
      if (stats.isDirectory() && file !== 'originalImg') {
        traverseDirectory(filePath)
      } else if (file == 'originalImg') {
        let curOriginalImgFilePath = path.join(directory, file)
        fs.readdirSync(curOriginalImgFilePath).forEach((oriFile) => {
          const oriFilePath = path.join(curOriginalImgFilePath, oriFile)
          const oriStats = fs.statSync(oriFilePath)
          if (oriStats.isFile() && /\.(jpg|jpeg|png|gif|bmp)$/i.test(oriFile)) {
            compressImage(oriFilePath, oriFile, directory)
          }
        })
      }

      // else if (stats.isFile() && /\.(jpg|jpeg|png|gif|bmp)$/i.test(file)) {
      //   compressImage(filePath, directory, file, traverseFiles)
      // }
    })
  }

  const fateGear = (url) => {
    const directory = url // 当前目录
    const destinationDirectory = path.join(directory)
    traverseDirectory(destinationDirectory)
    setTimeout(() => {
      setLoading(false)
    }, 300)
  }

  const getBg = () => {
    if (imgBg) {
      return
    }
    axios
      .get('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=en-US')
      .then((response) => {
        let imagesArr = response.data.images
        // 在这里可以对响应数据进行处理
        const randomNumber = Math.floor(Math.random() * imagesArr.length)
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
      messageApi.error('请设置压缩图片路径!')
      return
    }
    setDataList([])
    setLoading(true)
    fateGear(imgCompressPath)
  }

  ipcRenderer.on('select-file', (event, arg) => {
    if (arg.length > 0) {
      setImgCompressPath(arg[0])
    }
  })

  const onChange = (value) => {
    if (value < 20) {
      setQuality(20)
    } else {
      setQuality(value)
    }
  }

  function handleBeforeChange(value) {
    if (value < 20) {
      return false
    }
  }

  let bgStyle = {
    background: `#fff url(${imgBg}) no-repeat center center`
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

  const listStyle = {
    background: '#fff'
  }

  const antIcon = <LoadingOutlined style={{ fontSize: 24, color: 'fc5531' }} spin />

  return (
    <>
      <ConfigProvider
        theme={{
          components: {
            token: {
              // Seed Token，影响范围大
              colorPrimary: '#fc5531',
              colorPrimaryBorder: '#fc5531',
              colorPrimaryBorderHover: '#fc1944',
              borderRadius: 2,

              // 派生变量，影响范围小
              colorBgContainer: '#f6ffed',
              colorSplit: '#fc5531',
              colorBorder: '#fc5531',
              colorText: '#fff'
            },
            Button: {
              colorPrimary: '#fc5531',
              colorPrimaryActive: '#fc1944',
              colorPrimaryHover: '#fc1944'
            },
            Slider: {
              trackBg: '#fc5531',
              trackHoverBg: '#fc1944',
              dotActiveBorderColor: '#fc5531',
              handleActiveColor: '#fc1944',
              railBg: 'rgba(255,255, 255, 0.5)',
              railHoverBg: 'rgba(255,255, 255, 0.8)'
            },
            List: {},
            Spin: {
              contentHeight: '765px',
              colorPrimary: '#fc5531'
            }
          }
        }}
      >
        <div className="main" style={bgStyle}>
          <div className="nav">
            <div className="nav-set">
              <MinusOutlined style={colorIco} onClick={handleMinWin} />
              <CloseOutlined style={colorIco} onClick={handleCloseWin} />
            </div>
            <div className="nav-title">
              图片压缩
              <span className="nav-subTitle">选取文件夹压缩图片</span>
            </div>
          </div>
          <Spin
            spinning={loading}
            indicator={antIcon}
            tip="压缩中..."
            wrapperClassName="contentHeight"
          >
            <div className="contentHeight-main">
              <div className="main-top">
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    style={{ backgroundColor: '#fff' }}
                    placeholder="压缩图片文件夹路径"
                    disabled
                    value={imgCompressPath}
                  />
                  <Button icon={<SettingOutlined />} type="primary" onClick={handleGetFile}>
                    设置路径
                  </Button>
                  <Button icon={<PictureOutlined />} type="primary" onClick={handleCompressImg}>
                    开始图片压缩
                  </Button>
                </Space.Compact>
                <div className="quality-title">压缩品质设置:</div>
                <Slider
                  defaultValue={quality}
                  onChange={onChange}
                  min={20}
                  onAfterChange={handleBeforeChange}
                  // tooltip={{ open: true }}
                />
              </div>
              <div className="rule-line"></div>
              <div className="list-main">
                <List
                  style={listStyle}
                  bordered
                  dataSource={dataList}
                  renderItem={(item) => <List.Item>{item}</List.Item>}
                />
              </div>
            </div>
            {contextHolder}
            {messageContextHolder}
          </Spin>
        </div>
      </ConfigProvider>
    </>
  )
}

export default App
