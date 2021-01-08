/**
 * 个人哔哔接口程序
 * date: 2021.01.09
**/

'use strict';
//自定义api key
const serverkey = 'xxxx'
//引入模块
const tcb = require("@cloudbase/node-sdk");
//云开发初始化
const app = tcb.init({
  env: "bb-xxxxx"
});

//数据库初始化
const db = app.database()
const _ = db.command // 取指令

exports.main = async (event, context) => {
    //return event
    let apikey = event.queryStringParameters.key
    let content = ''
    if(serverkey == apikey ){
        const talksCollection = db.collection('talks')
        //提取消息内容，发送者，接受者，时间戳，消息类型，内容
        var CreateTime = Date.now(),
            Content = event.queryStringParameters.text,
            From = event.queryStringParameters.from
        if(Content == '/l'){ //查询
            var resData = ''
            const res = await talksCollection.where({}).orderBy("date", "desc").limit(9).get().then((res) => {
                for(var i=1;i<=res.data.length;i++){
                    console.log(res.data[i-1]);
                    resData += '/b'+i+' '+res.data[i-1].content+'\n---------------\n'
                }
            });
            content = '「最新哔哔」\n==================\n'+resData
        }else if(Content.substr(0,2) == '/a' || Content.substr(0,2) == '/e'){ //追加到或编辑第几条
            let Numb = 1,skipBb = 0,editCotent = ''
            let Mode = Content.substr(0,2)
            if(/^\/[ae]([1-9])\s+(.*)$/.test(Content)){
                let result = Content.match(/^\/[ae]([1-9])\s+(.*)$/)
                Numb = result[1]
                skipBb = Numb-1
                editCotent = result[2]
            }else if(/^\/[ae]\s+(.*)$/.test(Content)){
                let result = Content.match(/^\/[ae]\s+(.*)$/)
                editCotent = result[1]
            }
            const res = await talksCollection.where({}).orderBy("date", "desc").skip(skipBb).limit(1).get()
            let deId = res.data[0]._id
            let deContent = res.data[0].content
            if(Mode == '/a'){
                talksCollection.doc(deId).update({
                    content: deContent+''+editCotent
                })
                content = '已追加到第 '+Numb+ ' 条 '+deContent+''+editCotent
            }else{
                talksCollection.doc(deId).update({
                    content: editCotent
                })
                content = '已编辑第 '+Numb+ ' 条 '+editCotent
            }
        }else if(Content == '/d' || Content.substr(0,2) == '/d'){ //删除第几条
            let unNumb = 1
            if(/^\/d([1-9])$/.test(Content)){
                let result = Content.match(/^\/d([1-9])$/)
                unNumb = result[1]
            }
            let skipBb = unNumb-1
            const res = await talksCollection.where({}).orderBy("date", "desc").skip(skipBb).limit(1).get()
            let deId = res.data[0]._id
            talksCollection.doc(deId).remove()
            content = '已删除第 '+unNumb+ ' 条'
        }else if(Content == '/f' || Content.substr(0,2) == '/f'){ //删除哔哔
            let unNumb = 1
            if(/^\/f([1-9])$/.test(Content)){
                let result = Content.match(/^\/f([1-9])$/)
                unNumb = result[1]
            }
            for(var i=1;i<=unNumb;i++){
                    const res = await talksCollection.where({}).orderBy("date", "desc").limit(1).get()
                    let deId = res.data[0]._id
                    await talksCollection.doc(deId).remove();
            }
            content = '已删除前 '+unNumb+' 条'
        }else{
            var result = await talksCollection.add({content: Content, date: new Date(CreateTime), from: From})
            if(result.hasOwnProperty('id')){
                content = '发表成功'
            }else{
                content = '发表失败'
            }
        }
    }else{
        content = "key不匹配"
    }
    return {
        content
    };
}