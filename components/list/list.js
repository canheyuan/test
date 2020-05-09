
const commonFn = require('../../utils/common.js'); //一些通用的函数
const app = getApp(); //获取应用实例
Component({

  //组件的初始数据
  data: {
    domainUrl: app.globalData.domainUrl,

    listInfo: null,   //活动列表
    pageNum: 1,       //列表页码
    pageSize: 10,     //一页显示几个
    pageTotal: 0,     //列表总数
    isMoreData:true,  //是否有更多数据
    bottomTipText: ['上拉加载更多','没有更多了'],  //底部提示文字
  },

  properties: {
    targetPage: String, //目标页面
    reachData: {
      type: Number, // 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
      value: {}, // 属性初始值（可选），如果未指定则会根据类型选择一个
      observer: function (newVal, oldVal, changedPath) {
        //随机数大于1：重新刷新。小于1：上拉刷新
        var pageNum = this.data.pageNum;
        if (newVal > 1 || pageNum == 1) {
          this.setData({ pageNum : 1});
          this.getListFn(true);
        } else {
          if ((this.data.pageTotal / this.data.pageSize) > pageNum - 1) {
            this.getListFn();
          }
        }
      }
    }
  },

  //组件的方法列表
  methods: {

    //获取活动列表
    getListFn(isReach) {
      var _this = this;
      var url = '/activity/list'; //活动列表

      app.requestFn({
        url: url,
        data: {
          pageNum: _this.data.pageNum, //页码
          pageSize: _this.data.pageSize,  //每页显示几个
        },
        success: (res) => {
          var list = res.data.rows;

          var btmTipTxt = (list.length < _this.data.pageSize) ? '没有更多了' : '上拉加载更多';
          list = isReach ? list : _this.data.listInfo.concat(list);   //合并数组
          

          //设置data数据
          _this.setData({
            pageTotal: res.data.total,
            listInfo: list,
            bottomTipText: btmTipTxt,
            pageNum: _this.data.pageNum + 1
          });
        }
      });
    },

    //图片加载失败显示默认图
    errorImgFn(e) {
      //有三个参数：当前页面this，要替换的对象，替换图片地址
      commonFn.errorImg(this, e.currentTarget.dataset.obj);
    },

    //打开收藏弹窗
    collectPopShow(e) {
      this.triggerEvent('collectPopShow', { type: 'activity', id: e.currentTarget.dataset.id });
    }

  }
})