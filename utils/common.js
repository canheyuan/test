//验证手机号
const phoneregFn = phone => {
  const myreg = /^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
  return myreg.test(phone);
}

//验证邮箱
const emailRegFn = email =>{
  var reg = new RegExp("^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$"); //正则表达式
  return reg.test(email)
}

//时间戳转时间
const getDate = shijianchuo => {
  //shijianchuo是整数，否则要parseInt转换  
  var time = new Date(shijianchuo);
  var y = time.getFullYear();
  var m = time.getMonth() + 1;
  var d = time.getDate();
  var h = time.getHours();
  var mm = time.getMinutes();
  var s = time.getSeconds();
  return y + '-' + add0(m) + '-' + add0(d) + ' ' + add0(h) + ':' + add0(mm) + ':' + add0(s);
}; 
const add0 = m => { return m < 10 ? '0' + m : m };

//时间转时间戳
const getTimes = datetime =>{
  var date = new Date(datetime.replace(/-/g, '/'));
  return date.getTime();
}

//图片加载失败时加载预览图
const errorImg = (_this, obj, imgUrl )=>{
  var imgUrl = imgUrl ? imgUrl :"https://www.5iparks.com/static/yuanding/images/default/img_280_200.jpg";
  _this.setData({
    [obj]:imgUrl
  });
}

//详情页全局替换<o:p></o:p>
const replaceTxt = (str) => {
  var objTxt = str;
  var txt01 = "<o:p>";
  var txt02 = "</o:p>"
  var txt03 = '<o:p data-filtered="filtered">';
  objTxt = objTxt.replace(new RegExp(txt01, 'g'), '');
  objTxt = objTxt.replace(new RegExp(txt02, 'g'), '');
  objTxt = objTxt.replace(new RegExp(txt03, 'g'), '');
  return objTxt;
}



module.exports = {
  phoneregFn: phoneregFn, //验证手机
  emailRegFn: emailRegFn, //验证邮箱
  getDate: getDate, //时间戳转时间
  errorImg: errorImg, //图片加载失败
  getTimes: getTimes,  //时间转时间戳
  replaceTxt: replaceTxt  //替换详情页文本
}