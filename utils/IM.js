
var webim = require('webim_wx.js');
var IMConfig = require('config').IM;
const app = getApp()

var hasLogin = false


function newMsg(selToID){
    var selType = webim.SESSION_TYPE.C2C;
    var fromAccount = app.data.fromUser.id
    var selSess = webim.MsgStore.sessByTypeId( selType , selToID );
    console.log('会话内容：', selSess);
    var msgTime = Math.round(new Date().getTime() / 1000);//消息时间戳
    var random = Math.round(Math.random() * 4294967296);//消息随机数，用于去重
    var seq = -1;//消息序列，-1表示sdk自动生成，用于去重
    var isSend = true;//是否为自己发送
    var subType = webim.C2C_MSG_SUB_TYPE.COMMON;//webim.C2C_MSG_SUB_TYPE.COMMON-普通消息,
    if (!selSess) {
        selSess = new webim.Session(selType, selToID, selToID, null, msgTime);
    }
    var msg = new webim.Msg(selSess, isSend, seq, random, msgTime, fromAccount, subType, fromAccount);
    return msg
}


//发图片消息
function sendImageMsg(selToID, imageUrl ){
    var msg = newMsg(selToID);
    var customMsg = new webim.Msg.Elem.Custom(JSON.stringify({
        type: 'image',
        url: imageUrl
    }));
    msg.addCustom(customMsg);
    sendMsg( msg );
}


//发音频消息
function sendAudioMsg(selToID, audioUrl ){
    var msg = newMsg(selToID);
    var customMsg = new webim.Msg.Elem.Custom(JSON.stringify({
        type: 'audio',
        url: audioUrl
    }));
    msg.addCustom(customMsg);
    sendMsg( msg );
}

//发消息
function sendMsg( msg ){
    webim.sendMsg(msg, function () {
      // if (selType == webim.SESSION_TYPE.C2C) {
          //私聊时，在聊天窗口手动添加一条发的消息
          //群聊时，轮询接口会返回自己发的消息
          // showMsg(msg);
      // }
      //webim.Tool.setCookie("tmpmsg_" + app.data.toUser.identifier, '', 0);
      console.debug("发消息成功");
    }, function (err) {
      console.error("发消息失败:" + err.ErrorInfo);
    });
}



function login( listeners ,callback){
    var config = {
      sdkAppID: IMConfig.sdkAppID,
      appIDAt3rd: IMConfig.appIDAt3rd, //用户所属应用id，必填
      accountType: IMConfig.accountType, //用户所属应用帐号类型，必填
      identifier: app.data.fromUser.id, //当前用户ID,必须是否字符串类型，选填
      identifierNick: app.data.fromUser.nick, //当前用户昵称，选填
      userSig: app.data.fromUser.sig, //当前用户身份凭证，必须是字符串类型，选填
  };
    if( !hasLogin ){
        webim.login(config, listeners,{}, function(){
            hasLogin = true;
            callback();
        });
    }else{
      callback();
    }
}


module.exports = {
    login : login,
    sendImageMsg : sendImageMsg,
    sendAudioMsg : sendAudioMsg,
    sendMsg: sendMsg
};