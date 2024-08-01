export const common = {
  /**
   * Validate kiểm tra dữ liệu nhập là số
   * @param {string} $event Dữ liệu cần validate
   * @author: DUONGPV (15/08/2022)
   */
  formatCurrency(value) {
    try {
      let newVal = value
        .toString()
        .replace(/^0+/, "")
        .replace(/\D/g, "")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return newVal;
    } catch (error) {
      console.log(error);
    }
  },

  formatDecimalCurrency(value) {
    try {
      if (value) {
        let newVal = value
          .toFixed()
          .toString()
          .replace(/^0+/, "")
          .replace(/\D/g, "")
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return newVal;
      }
      return 0;
    } catch (error) {
      console.log(error);
    }
  },

  createUUID() {
    var dt = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
    return uuid;
  },

  formatDate(date) {
    let d = new Date(date);
    var month = "" + (d.getMonth() + 1);
    var day = "" + d.getDate();
    var year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  },

  formatDateWithType(date, type) {
    if (date != null) {
      let d = new Date(date);
      var month = "" + (d.getMonth() + 1);
      var day = "" + d.getDate();
      var year = d.getFullYear();

      if (month.length < 2) month = "0" + month;
      if (day.length < 2) day = "0" + day;
      switch (type) {
        case "DD/MM/YYYY":
          return [day, month, year].join("/");
        case "YYYY-MM-DD":
          return [year, month, day].join("-");
      }
    }
    return "";
  },

  /**
   * Validate kiểm tra dữ liệu nhập là số
   * @param {string} $event Dữ liệu cần validate
   * @author: DUONGPV (15/08/2022)
   */
  removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
    // Remove extra spaces
    // Bỏ các khoảng trắng liền nhau
    str = str.replace(/ + /g, " ");
    str = str.trim();
    // Remove punctuations
    // Bỏ dấu câu, kí tự đặc biệt
    str = str.replace(
      /!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g,
      " "
    );
    return str;
  },

  keypresOnlyNumber(e) {
    var key = e.keyCode || e.charCode;
    if (
      (key < 48 || key > 57) &&
      key != 32 &&
      key != 43 &&
      key != 40 &&
      key != 41
    ) {
      e.preventDefault();
    }
  },

  /**
   * Refesh object
   * AUTHOR: DUONGPV (05/08/2022)
   */
  refreshObject(object) {
    try {
      Object.keys(object).forEach((key) => {
        object[key] = "";
      });
      return object;
    } catch (error) {
      console.log(error);
    }
  },

  newObject(object) {
    try {
      var newObject = object;
      Object.keys(newObject).forEach((key) => {
        newObject[key] = "";
      });
      return newObject;
    } catch (error) {
      console.log(error);
    }
  },

  /**
   * Kiểm tra hai object có như nhau không
   * @param {*} obj1: Giá trị đối tượng thứ nhất
   * @param {*} obj2: Giá trị đối tượng thứ hai
   * Author: DUONGPV (29/07/2022)
   */
  objCompare(obj1, obj2) {
    const Obj1_keys = Object.keys(obj1);

    for (let k of Obj1_keys) {
      if (obj1[k] && obj2[k] != undefined) {
        if (obj1[k] !== obj2[k]) {
          return false;
        }
      }
    }
    return true;
  },
};
