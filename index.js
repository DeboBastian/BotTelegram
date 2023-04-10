
const express = require('express');
const { Telegraf } = require('telegraf')
const axios = require('axios').default;
const { Configuration, OpenAIApi } = require('openai');
const { chatGPT } = require('./utils');

//Configuracion del fichero de entorno
require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN)




//CONFIGURACION TELEGRAF
app.use(bot.webhookCallback('/telegram-bot'))
bot.telegram.setWebhook(`${process.env.BOT_URL}/telegram-bot`)


app.post('/telegram-bot', (req, res) => {
    res.send('Hola Bot')
})


//COMANDOS (VAMOS A INTERACTUAR A PARTIR DE AHORA DIRECTAMENTE CON EL BOT)
bot.command('test', (ctx) => {
    console.log(ctx.message)
    ctx.reply('FUNSIONAAAAA!!!!!!!');
    ctx.replyWithDice(); // contesta tirando un dado al azar
})
//1º nombre del comando y despues funcion callback(ctx)


bot.command('tiempo', async (ctx) => {
    //return
    const ciudad = ctx.message.text.substring(7).trim(); // Tiempo Madrid

    // const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${process.env.OWM_API_KEY}&units=metric`)

    //la misma respuesta puede ser igual que con axios pero haciendolo con fetch
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${process.env.OWM_API_KEY}&units=metric`)
    const data = await response.json()

    const {
        main: { temp, temp_min, temp_max, humidity },
        coord: { lon, lat } } = data
    //console.log(data.main.temp)

    ctx.reply(`Los datos de temperatura en ${ciudad}:
    Actual: ${temp}º
    Máxima: ${temp_max}º
    Mínima: ${temp_min}º
    Humedad: ${humidity}`)

    ctx.replyWithLocation(lat, lon)
})


bot.command('receta', async ctx => {
    // /receta huevos, aguacate, chorizo
    const ingredientes = ctx.message.text.substring(7).trim()
    try {
        //La funcion la tenemos en utils:
        const titulo = await chatGPT(`Dame el título de una receta que pueda cocinar con los siguientes ingredientes: ${ingredientes}`)


        const elaboracion = await chatGPT(`Dame la elaboración para la receta con este título: ${título}`)

        ctx.reply(titulo)
        ctx.reply(elaboracion)
    } catch (error) {
        ctx.reply('No puedo hacerte esa receta')
    }

})


bot.on('message', async ctx => {

    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY
    })

    const openai = new OpenAIApi(configuration)
    const completion = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
            { role: 'assistant', content: 'Eres un bot de telegram. Tu nombre es @debo_bot. Todas las respuestas las devuelves como si fueras Chiquito de la Calzada' },
            { role: 'user', content: `Respondeme en menos de 100 carácteres al siguiente texto: ${ctx.message.text}` }
        ]

    })

    ctx.reply(completion.data.choices[0].message.content)
})

// ponemos la app a escuchar
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
})