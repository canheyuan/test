module.exports = {
   /*  COSv4 : {
        appid: '1253488539', // Bucket 所属的项目 ID
        bucket: "imsdk", // 空间名称 Bucket ,记住是 - 的前半部分，不包括后面的数字部分
        region: 'gz', // bucket 的地域简称，华南：gz，华北：tj，华东：sh
        sid: '', // 项目的 SecretID
        skey: '' // 项目的 Secret Key
    }, */
    COSv5 : {
      appid: '01254126397', // Bucket 所属的项目 ID
      bucket: "miniprog001-1254126397",  //空间名称 Bucket demo的IM处理封装
      region: 'ap-guangzhou', //ap-
      sid: 'AKID1whIhuqlRDrMgp8vxqcDuVv9B3EJ9RRI', // 项目的 SecretID
      skey: 'rbEkZIuNeNzUoEYq25zkw1wkWEnDRsFX' // 项目的 Secret Key
    },
    IM : {
        sdkAppID: 1400131035,
        appIDAt3rd: 1400131035, //用户所属应用id，必填
        accountType: 36152, //用户所属应用帐号类型，必填
    }
};