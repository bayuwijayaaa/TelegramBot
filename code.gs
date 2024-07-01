// kredensial
const spreadsheetId      = '1N-6vSKg2akYwgjTuTxyIy9wb-W3PxSPIZ4zrG6IX5tc'
const dataOrderSheetName = 'Data Order'
const logSheetName       = 'Log'

const botHandle      = '@materialinput_bot'
const botToken       = '7206837593:AAFplmvAFcNwyYFQXOR9NI458-cOPKMo7hM'
const appsScriptUrl  = 'https://script.google.com/macros/s/AKfycby4TZWgmdEwsI0M8x3KxCIjegZlC39GUwFfMscz0D0jthnQyf2jrwyntqoESHd-HDO23g/exec'
const telegramApiUrl = `https://api.telegram.org/bot${botToken}`

function log(logMessage = '') {
  // akses sheet
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  const sheet       = spreadsheet.getSheetByName(logSheetName)
  const lastRow     = sheet.getLastRow()
  const row         = lastRow + 1

  // inisiasi nilai
  const today = new Date

  // insert row kosong
  sheet.insertRowAfter(lastRow)

  // insert data
  sheet.getRange(`A${row}`).setValue(today)
  sheet.getRange(`B${row}`).setValue(logMessage)
}


function formatDate(date) {
  const monthIndoList = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

  const dateIndo  = date.getDate()
  const monthIndo = monthIndoList[date.getMonth()]
  const yearIndo  = date.getFullYear()

  const result = `${dateIndo} ${monthIndo} ${yearIndo}`

  return result
}


function sendTelegramMessage(chatId, replyToMessageId, textMessage) {
  // url kirim pesan
  const url = `${telegramApiUrl}/sendMessage`;
  
  // payload
  const data = {
    parse_mode              : 'HTML',
    chat_id                 : chatId,
    reply_to_message_id     : replyToMessageId,
    text                    : textMessage,
    disable_web_page_preview: true,
  }
  
  const options = {
    method     : 'post',
    contentType: 'application/json',
    payload    : JSON.stringify(data)
  }

  const response = UrlFetchApp.fetch(url, options).getContentText()
  return response;
}


function parseMessage(message = '') {
  // pisahkan berdasarkan karakter enter
  const splitted = message.split('\n')

  // inisiasi variabel
  let namateknisi     = ''
  let mitra           = ''
  let jenismaterial   = ''
  let panjang         = ''
  let tahun           = ''
  let jumlah          = ''

  // parsing pesan untuk mencari nilai variabel
  splitted.forEach(el => {
    namateknisi = el.includes('Nama Teknisi:') ? el.split(':')[1].trim().replaceAll('\n', ' ') : namateknisi;
    mitra = el.includes('Mitra:') ? el.split(':')[1].trim().replaceAll('\n', ' ') : mitra;
    jenismaterial = el.includes('Jenis Material:') ? el.split(':')[1].trim().replaceAll('\n', ' ') : jenismaterial;
    panjang = el.includes('Panjang:') ? el.split(':')[1].trim().replaceAll('\n', ' ') : panjang;
    tahun = el.includes('Tahun:') ? el.split(':')[1].trim().replaceAll('\n', ' ') : tahun;
    jumlah = el.includes('Jumlah:') ? el.split(':')[1].trim().replaceAll('\n', ' ') : jumlah;
  })

  // kumpulkan hasil
  const result = {
    namateknisi      : namateknisi,
    mitra            : mitra,
    jenismaterial    : jenismaterial,
    panjang          : panjang,
    tahun            : tahun,
    jumlah           : jumlah,
  }

  // jika data kosong
  const isEmpty = (namateknisi === '' && mitra === '' && jenismaterial === '' && panjang === ''&& tahun === '' && jumlah === '')

  return isEmpty ? false : result
}


function inputDataOrder(data) {
  try {
    // akses sheet
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId)
    const sheet = spreadsheet.getSheetByName(dataOrderSheetName)
    const lastRow = sheet.getLastRow()
    const row = lastRow + 1

    // inisiasi nilai
    const number  = lastRow
    const idSubmit = `RF-${number}`
    const today   = new Date

    // insert row kosong
    sheet.insertRowAfter(lastRow)

    // insert data
    sheet.getRange(`A${row}`).setValue(number)
    sheet.getRange(`B${row}`).setValue(idSubmit)
    sheet.getRange(`C${row}`).setValue(today)
    sheet.getRange(`D${row}`).setValue(data['namateknisi'])
    sheet.getRange(`E${row}`).setValue(data['mitra'])
    sheet.getRange(`F${row}`).setValue(data['jenismaterial'])
    sheet.getRange(`G${row}`).setValue(data['panjang'])
    sheet.getRange(`H${row}`).setValue(data['tahun'])
    sheet.getRange(`I${row}`).setValue(data['jumlah'])
    sheet.getRange(`J${row}`).setValue(data['chatId'])

    // jika berhasil, return idSubmit
    return idSubmit

  } catch(err) {
    return false
  }
}


function doPost(e) {
  try {
    // urai pesan masuk
    const contents            = JSON.parse(e.postData.contents)
    const chatId              = contents.message.chat.id
    const receivedTextMessage = contents.message.text.replace(botHandle, '').trim() // hapus botHandle jika pesan berasal dari grup
    const messageId           = contents.message.message_id

    let messageReply = ''

    // 1. jika pesan /start
    if (receivedTextMessage.toLowerCase() === '/start') {
      // tulis pesan balasan
      messageReply = `Halo! Status bot dalam keadaan aktif.`

    // 2. jika pesan diawali dengan /input
    } else if (receivedTextMessage.split('\n')[0].toLowerCase() === '/input') {
      const parsedMessage = parseMessage(receivedTextMessage)

      // 2a.jika ada data
      if (parsedMessage) {
        const data = {
          namateknisi      : parsedMessage['namateknisi'],
          mitra: parsedMessage['mitra'],
          jenismaterial    : parsedMessage['jenismaterial'],
          panjang      : parsedMessage['panjang'],
          tahun      : parsedMessage['tahun'],
          jumlah      : parsedMessage['jumlah'],
          chatId    : chatId
        }

        // insert data ke sheet
        const idSubmit = inputDataOrder(data)

        // tulis pesan balasan
        messageReply = idSubmit ? `Data berhasil disimpan dengan ID Submit <b>${idSubmit}</b>` : 'Data gagal disimpan'

      // 2b. jika tidak ada data
      } else {
        messageReply = 'Data kosong dan tidak dapat disimpan'
      }

    // 4. format
    } else if (receivedTextMessage.toLowerCase() === '/format') {
      messageReply = `Untuk <b>input data material </b> gunakan format:

<pre>/input
Nama Teknisi: 
Mitra: 
Jenis Material: 
Panjang: 
Tahun: 
Jumlah: </pre>

(Jika ada data yang tidak diketahui gunakan (-))`

    // 5. format salah
    } else {
      messageReply = `Pesan yang Anda kirim tidak sesuai format.

Kirim perintah /format untuk melihat daftar format pesan yang tersedia.`
    }

    // kirim pesan balasan
    sendTelegramMessage(chatId, messageId, messageReply)

  } catch(err) {
    log(err)
  }
}

function setWebhook() {
  // akses api
  const url      = `${telegramApiUrl}/setwebhook?url=${appsScriptUrl}`
  const response = UrlFetchApp.fetch(url).getContentText()
  
  Logger.log(response)
}