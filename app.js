//app.js
var Config = require('utils/config.js').IM;
var webim = require('utils/webim_wx.js');
var chatIm = require('utils/chatIm.js');

App({
  onLaunch: function (opt) {
    console.log('app   onLaunch');
    //console.log(opt);
    if (opt.query.config == 'demo') {
      this.globalData.jkUrl = this.globalData.jkDemoUrl;
    } else if (opt.query.config == 'dev') {
      this.globalData.jkUrl = this.globalData.jkDevUrl;
    } else if (opt.query.config == 'local') {
      this.globalData.jkUrl = this.globalData.jkLocal;
    }
    //获取登录信息
    this.getWxLoginInfo(this);

  },

  globalData: {
    appVersion: '1.0.07.20181022', //上传的版本号
    loginInfo: null,  //缓存用户信息
    userInfo: null, //微信登录后获取的用户信息

    loginCode: '', //微信登录获取code
    sessionId: '',
    isLogin: false,  //登录状态
    // domainUrl: 'http://192.168.0.244/yuanding',
    domainUrl: 'https://www.5iparks.com/static/yuanding',
    jkUrl: 'https://www.5iparks.com/api',  //正式版
    jkDemoUrl: "https://demo.5iparks.com/api",  //演示版
    jkDevUrl: 'http://192.168.0.244:8080/api', //开发板
    jkLocal: 'http://192.168.0.205:8080/api',  //佳隆本地版

    foundTag: 0, //进入发现页，0新鲜事，1政策
    indexReach: false,  //进入首页是否刷新
    foundReach: false, //发现页面是否刷新
    expertReach: false,   //进入发现页专家列表是否刷新
    userIndexReach: false,  //进入我的页面是否刷新
    userInfoReach: false,   //进入修改信息页面是否刷新

    apiMsgSwitch: true,  //控制接口提示信息开关,true:开，false:关
    isChatLogin: false, //控制是否调用聊天登录,true:开启，false:关闭
    isWxLogin: false,  //控制是否在加载获取用户信息接口
    indexBook: false, //首页线上图书模块

  },

  //统一的调用接口函数，接口返回错误码code（206:未认证企业；207：sessionId失效；0：正常）
  requestFn(option) {
    var _this = this;
    let opt = option ? option : null;
    let opt_default = {
      isLoading: true,
      isCloseLoading: true,  //是否关闭加载
      loadTitle: '数据加载中',
      isLoginTip: false,
      isSessionId: true,
      url: '', //前缀不用写
      header: 'application/json',
      method: 'GET',
      data: {},
      dataType: 'json',
      success: null,  //成功回调函数
      fail: null,     //失败回调函数
      complete: null   //调用接口完回调函数
    };
    opt = opt ? Object.assign(opt_default, opt) : opt_default;
    if (opt.isLoading) { wx.showLoading({ title: opt.loadTitle, mask: true }); }
    wx.request({
      url: _this.globalData.jkUrl + opt.url,
      method: opt.method,
      header: {
        "Content-Type": opt.header,
        "5ipark-sid": opt.isSessionId ? _this.globalData.sessionId : ''
      },
      data: opt.data,
      dataType: opt.dataType,
      success: (res) => {
        if (opt.isCloseLoading) { wx.hideLoading(); }
        var apiData = res.data;
        if (apiData.code == 0) {

          if (opt.success) { opt.success(res, opt.page) }; //成功回调函数

        } else if (apiData.code == 207) {
          //sessionID失效,跳转到登录页面
          if (opt.isLoginTip) {
            wx.showToast({ title: '登录已超时，请重新登录再进行操作！', icon: 'none', duration: 3000 });
          }

          if (!_this.globalData.isWxLogin) {
            _this.globalData.isWxLogin = true;  //控制接口sessionID失效时不会重复调用wxLogin
            _this.globalData.isLogin = false;
            _this.globalData.sessionId = ''
            wx.removeStorageSync('userInfo'); //清除之前缓存
            //重新调用微信授权
            _this.getWxLoginInfo(_this, function () {
              _this.data.pageThis.reachFn();
            });
          }


        } else {
          this.globalData.indexReach = false;
          wx.showToast({ title: res.data.msg, icon: 'none', duration: 3000 });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '数据加载失败', icon: 'none', duration: 3000 });
        if (opt.failFn) { opt.failFn() }; //失败回调函数
      },
      complete() {
        if (opt.complete) { opt.complete() }; //失败回调函数
      }
    });
  },

  //聊天工具
  getIMHandler() {
    return this.iIMHandler;
  },

  //获取IM用户信息
  getImUserInfo() {
    this.requestFn({
      url: '/info4im',
      success: (res) => {
        if (this.globalData.apiMsgSwitch) { console.log("聊天接口：", res.data.data); }
        this.data.fromUser = res.data.data;
        if (this.globalData.isChatLogin) {
          this.chatLogin();
        }
      }
    })
  },

  //调用支付函数
  wxPayFn(payData, callback) {
    var _this = this;
    wx.requestPayment({
      'timeStamp': payData.timeStamp,
      'nonceStr': payData.nonceStr,
      'package': payData.package,
      'signType': 'MD5',
      'paySign': payData.paySign,
      'success': function (res) {
        console.log("支付成功", res);
        if (callback) { callback(res); }
      },
      'fail': function (res) {
        console.log("支付失败", res);
        if (callback) { callback(res); }
      }
    })
  },

  //获取用户登录信息
  getWxLoginInfo(_this, callback) {
    if (this.globalData.apiMsgSwitch) { console.log('用户登录信息函数'); }
    var userInfoStorage = wx.getStorageSync('userInfo') ? wx.getStorageSync('userInfo') : null;  //从缓存获取用户信息
    _this.globalData.loginInfo = userInfoStorage;

    if (!userInfoStorage || !userInfoStorage.userInfo.headImgs) {  //判断是否有缓存
      if (userInfoStorage) { _this.globalData.sessionId = userInfoStorage.sessionId };
      //获取登录code
      _this.wxLogin(_this, function () {

        wx.getSetting({
          success: res => {
            //判断是否已经授权  
            if (res.authSetting['scope.userInfo']) {
              // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
              _this.getUserInfo(function (res) {
                if (_this.globalData.apiMsgSwitch) { console.log("获取用户登录信息：", res); }
                _this.afterGetUserInfo(_this, res, function () {
                  if (callback) { callback(); }
                });
              });
            } else {
              _this.afterGetUserInfo(_this);
            }
          }
        });
      });

    } else {
      console.log("缓存获取用户数据：", userInfoStorage);

      _this.globalData.isLogin = (userInfoStorage && userInfoStorage.loginName) ? true : false; //登录状态
      _this.globalData.loginInfo = userInfoStorage;
      _this.globalData.sessionId = userInfoStorage.sessionId;
      this.getImUserInfo();



    }
  },

  //小程序登录，获取login_code
  wxLogin(_this, callback) {
    wx.login({
      success: res => {
        _this.globalData.loginCode = res.code;
        if (this.globalData.apiMsgSwitch) { console.log('loginCode:', res.code); }
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        if (callback) { callback(); }
      }
    });
  },

  //获取用户信息
  getUserInfo(callback) {
    wx.getUserInfo({
      success: res => {
        // 可以将 res 发送给后台解码出 unionId
        if (this.globalData.apiMsgSwitch) { console.log("获取用户信息：", res); }
        if (callback) { callback(res); }
      }
    })
  },

  //微信登录后获取登录信息
  afterGetUserInfo(_this, obj, callback) {
    var data = null;
    //判断是否已授权，获取不同的参数
    if (!obj) {
      data = { code: _this.globalData.loginCode }
    } else {
      data = {
        code: _this.globalData.loginCode,
        rawData: obj.rawData,
        encryptedData: obj.encryptedData,
        iv: obj.iv,
        signature: obj.signature
      };
    }
    var headData = {
      "Content-Type": "application/x-www-form-urlencoded"
    };
    if (_this.globalData.sessionId) {
      headData['5ipark-sid'] = _this.globalData.sessionId
    }

    wx.request({
      url: _this.globalData.jkUrl + '/wxlogin',
      method: 'post',
      header: headData,
      data: data,
      success: (res) => {
        console.log('wxLogin获取最终用户信息:', res.data);
        if (res.data.code == 0) {
          var loginInfo = res.data.data;
          wx.setStorageSync('userInfo', loginInfo); //设置缓存用户信息
          _this.globalData.loginInfo = loginInfo;
          _this.globalData.sessionId = loginInfo.sessionId
          _this.globalData.isWxLogin = false; //
          if (loginInfo && loginInfo.loginName) {
            _this.globalData.isLogin = true; //登录状态
          }

          if (callback) { callback(); }  //回调函数
        } else {
          if (callback) { callback(); }  //回调函数
        }
      },
      fail() {

      }
    });
  },



  data: {
    chatPage: '',
    pageThis: null,  //当前页面的this
    chatLoginSuccess: false,
    Config: {
      sdkappid: Config.sdkAppID,//
      accountType: Config.accountType,
      accountMode: 0 //帐号模式，0-表示独立模式
    },
    fromUser: null,
    toUser: {
      id: '',
      faceUrl: ''
    },
  },

  //聊天登录
  chatLogin(callback) {
    var _this = this;
    var loginInfo = {
      'sdkAppID': _this.data.Config.sdkappid, //用户所属应用id,必填
      'appIDAt3rd': _this.data.Config.sdkappid, //用户所属应用id，必填
      'accountType': _this.data.Config.accountType, //用户所属应用帐号类型，必填
      'identifier': _this.data.fromUser.id, //当前用户ID,必须是否字符串类型，选填
      'identifierNick': _this.data.fromUser.nick, //当前用户昵称，选填
      'userSig': _this.data.fromUser.sig, //当前用户身份凭证，必须是字符串类型，选填
    }

    //事件回调对象 监听事件
    var listeners = {
      "onConnNotify": _this.onConnNotify, //监听连接状态回调变化事件,必填
      "onMsgNotify": _this.onMsgNotify//监听新消息(私聊，普通群(非直播聊天室)消息，全员推送消息)事件，必填
    };

    var options = {};

    //sdk登录(独立模式)
    webim.login(loginInfo, listeners, options, function (resp) {

      console.log("登录成功APP");
      _this.data.chatLoginSuccess = true;

      if (callback) { callback() }
    }, function (err) {
      console.log("登录失败", err.ErrorInfo)
    });
  },

  //1v1单聊的话，一般只需要 'onConnNotify' 和 'onMsgNotify'就行了。
  //监听连接状态回调变化事件
  onConnNotify(resp) {
    var info;
    switch (resp.ErrorCode) {//链接状态码
      case webim.CONNECTION_STATUS.ON:
        webim.Log.warn('建立连接成功: ' + resp.ErrorInfo);
        break;
      case webim.CONNECTION_STATUS.OFF:
        info = '连接已断开，无法收到新消息，请检查下您的网络是否正常: ' + resp.ErrorInfo;
        webim.Log.warn(info);
        break;
      case webim.CONNECTION_STATUS.RECONNECT:
        info = '连接状态恢复正常: ' + resp.ErrorInfo;
        webim.Log.warn(info);
        break;
      default:
        webim.Log.error('未知连接状态: =' + resp.ErrorInfo); //错误信息
        break;
    }
  },

  //监听新消息事件     注：其中参数 newMsgList 为 webim.Msg 数组，即 [webim.Msg]。
  //newMsgList 为新消息数组，结构为[Msg]
  onMsgNotify(newMsgList, callback) {
    console.log('监听新消息事件333', newMsgList);
    if (!newMsgList) { return };

    //做缓存记录未读消息
    var msgStorage = wx.getStorageSync('msgStorage') ? wx.getStorageSync('msgStorage') : [];
    newMsgList.forEach((item, i) => {
      var isMsg = false;  //当前账号是否有未读消息
      msgStorage.forEach(item2 => {
        if (item2.fromAccount == item.fromAccount) {
          item2.fromAccount = item.fromAccount
          item2.unread = item2.unread + 1; //未读消息数
          isMsg = true;
        }
      });
      if (!isMsg) {
        var nesMsg = {};
        nesMsg.fromAccount = item.fromAccount
        nesMsg.unread = 1; //未读消息数
        msgStorage.push(nesMsg);
      }
    })
    wx.setStorageSync('msgStorage', msgStorage);
    callback && callback();

    if (this.data.chatPage == 'chat-detail') { //聊天会话页面

      var sess, newMsg;
      //获取所有聊天会话
      var selSess = null;
      var sessMap = webim.MsgStore.sessMap();
      var newMsg2 = null;
      for (var j in newMsgList) {//遍历新消息
        newMsg = newMsgList[j];
        if (newMsg.getSession().id() == this.data.toUser.id) {//为当前聊天对象的消息
          selSess = newMsg.getSession();
          //在聊天窗体中新增一条消息
          newMsg2 = chatIm.addMsg(this, newMsg);
        }
      }

      var chatList = this.data.pageThis.data.chatItems.concat(newMsg2);
      chatList.forEach(item => {
        item.headUrl = item.isMy ? this.data.fromUser.faceUrl : this.data.toUser.faceUrl;
        item.headUrl = item.headUrl ? item.headUrl : (this.globalData.domainUrl + '/images/default/df_userhead.png');
      });
      console.log('chatList:', chatList);
      this.data.pageThis.setData({
        chatItems: chatList,
        scrollTopVal: chatList.length * 999
      });

      //消息已读上报，以及设置会话自动已读标记
      webim.setAutoRead(selSess, true, true);

      //阅读消息后清除未读消息缓存
      var msgStorage = wx.getStorageSync('msgStorage') ? wx.getStorageSync('msgStorage') : [];
      msgStorage = msgStorage.filter(item => {
        return item.fromAccount != this.data.toUser.id
      });
      wx.setStorageSync('msgStorage', msgStorage);

    } else if (this.data.chatPage == 'chat-list') {
      this.data.pageThis.initRecentContactList(); //获取会话列表        
    } else if (this.data.chatPage == 'index') {
      this.data.pageThis.getNotification(); //获取会话列表        
    }