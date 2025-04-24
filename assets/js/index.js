$(document).ready(function () {
  //初始化
  init();
  
  // 目前選擇的 log 資訊
  current_log_data = {}

  async function init() {
    await check_login();
    console.log('.... enter  index.html')
    current_log_data = {
      year: 0,
      week:0, 
      log: {}
    };
    fill_week(true);
  }

  async function check_login() {
    $.ajax({
      url: "src/check_login.php",
      method: "POST",
      success: function(response) {
        console.log(response);
        if (!response.logged_in) {
          window.location.href = "login.html";
        } else {
          $('#welcomeUser').text('歡迎，' + response.user +'！')
        }
      }
    });
  }

  function getISOWeeks(y) {
    var d,
      isLeap;
  
    d = new Date(y, 0, 1);

    // 是否為閏年
    isLeap = new Date(y, 1, 29).getMonth() === 1; // -: 一月; 1: 二月; 2: 三月
  
    //check for a Jan 1 that's a Thursday or a leap year that has a 
    //Wednesday jan 1. Otherwise it's 52
    return d.getDay() === 4 || isLeap && d.getDay() === 3 ? 53 : 52;
  }

  function fill_week(selectNowWeek = null) {
    const year = $('#year').val();
    const $weekSelect = $("#week");
    $weekSelect.empty(); // 清空 select

    const lastWeek = getISOWeeks(year);
    

    for (let i = 1; i <= lastWeek; i++) {
      let weekNumber = i.toString().padStart(2, "0"); // 補 0 變成兩位數
      
      $weekSelect.append(
        `<option value="${weekNumber}">第 ${weekNumber} 週</option>`
      );
    }

    if (selectNowWeek) {
      // 計算今天是第幾週
      currentWeek = getWeekNumber();
      $weekSelect.val(currentWeek.toString().padStart(2, "0"));
    }
  }

  function getWeekNumber(dateString = null) {
    // const date = (dateString == null) ? new Date() : new Date(dateString);
    // const startOfYear = new Date(date.getFullYear(), 0, 1);
    // const dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    // return Math.ceil((dayOfYear + 1) / 7);

    // 如果沒有傳入日期字串，則使用當前日期
    const date = (dateString == null) ? new Date() : new Date(dateString);
    
    // 計算該日期所屬年份的 1 月 1 日
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    
    // 計算當前日期是當年中的第幾天
    const dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    
    // 返回當前日期所屬的週數（四捨五入後）
    return Math.ceil((dayOfYear + 1) / 7);
  }

  function getWeekStartEnd(year, week) {
    // 1月1日
    const startOfYear = new Date(year, 0, 1);
    
    // 1月1日是星期幾（0為星期天，6為星期六）
    const dayOfWeek = startOfYear.getDay();
    
    // 調整1月1日為當週的星期一
    const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    startOfYear.setDate(startOfYear.getDate() - daysToMonday);
    
    // 計算當週的開始日期 (週一)
    const startOfWeek = new Date(startOfYear);
    startOfWeek.setDate(startOfYear.getDate() + (week - 1) * 7);
    
    // 計算當週的結束日期 (週日)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // 格式化為 Y-m-d
    const formatDate = (date) => date.toISOString().split('T')[0];

    const real_year = (week > 0) ? parseInt(year) : parseInt(year) - 1;
    const real_week = (week > 0) ? week : getISOWeeks(real_year);

    return {
      start_date: formatDate(startOfWeek),
      end_date: formatDate(endOfWeek),
      real_year: real_year,
      real_week: real_week
    };
  }

  // 載入工作日誌
  $("#loadLog").on("click", async function () {
    const year = $("#year").val();
    const week = $("#week").val();
    await loadWorkLog(year, week);
    await Promise.all([
      generateLogHtml(current_log_data.log.current, $('#current-log')),
      generateLogHtml(current_log_data.log.previous, $('#previous-log'))
    ]);
  });

  async function loadWorkLog(year, week) {
    // 顯示滿版遮罩
    $("#loadingOverlay").show();

    // current_log_data = {};
    $('.tool-bar').find('.add, .edit').removeClass('activity');
    await $.ajax({
      url: "load_work_log.php",
      type: "POST",
      data: { year: year, week: week },
      dataType: 'json', // 預期伺服器回傳 JSON 格式
      success: function (response) {
        if (response.error) {
          alert("載入失敗: " + response.error); // 顯示錯誤訊息
        } else {
          // 正常處理回應的資料
          current_log_data.year = year;
          current_log_data.week = week;
          current_log_data.log = response; // 假設回應是正確的資料
        }
      },
      error: function (jqXHR, textStatus, error) {
        alert("載入失敗: " + error);
      },
      complete: function () {
        // AJAX 完成後隱藏遮罩
        $("#loadingOverlay").hide();
      }
    });
  }

  function generateLogHtml(logData, target) {
    if (!logData) {
      target.html('<p>無資料</p>');
      target.siblings('.tool-bar').find('.add').addClass('activity');
    } else{
      target.html(`
        <div class="log-entry">
          <h2>週期：${logData.week} (${logData.date_range})</h2>
          <p><strong>總時數：</strong> ${logData.total_hours}</p>
          <p><strong>摘要：</strong> ${logData.task_summary}</p>

          <h3>✅ 完成的任務</h3>
          ${logData.tasks.completed.length > 0 ? 
          `<ul>${logData.tasks.completed.map(task => `<li>${task}</li>`).join('')}</ul>`:
          '<ul><li class="no-list-style">無</li></ul>'}

          <h3>🔄 進行中的任務</h3>
          ${logData.tasks.in_progress.length > 0 ? 
          `<ul>${logData.tasks.in_progress.map(task => `<li>${task}</li>`).join('')}</ul>`:
          '<ul><li class="no-list-style">無</li></ul>'}


          <h3>⏳ 計劃中但未開始</h3>
          ${logData.tasks.planned.length > 0 ? 
          `<ul>${logData.tasks.planned.map(task => `<li>${task}</li>`).join('')}</ul>`:
          '<ul><li class="no-list-style">無</li></ul>'}

          <h3>🚧 暫緩</h3>
          ${logData.tasks.blocked.length > 0 ? 
              `<ul>${logData.tasks.blocked.map(issue => `<li>${issue}</li>`).join('')}</ul>` :
              '<ul><li class="no-list-style">無</li></ul>'}
          
          <h3>📝 備註</h3>
          <textarea>${logData.notes}</textarea>
        </div>
      `);
      target.siblings('.tool-bar').find('.edit').addClass('activity');
      target.find('.log-entry textarea').trigger('input');
    }
  }
  
  $("#year").on('change', function() {
    fill_week();
  });

  $(".toggle-btn").on("click", function () {
    const leftSide = $(".left-side");
    const rightSide = $(".right-side");

    if ($(this).hasClass("left-toggle")) {
      // 點左邊
      if (leftSide.hasClass("collapsed")) {
        // 展開
        // 還原左側，右側恢復 50%
        leftSide.removeClass("collapsed").css({ width: "50%" });
        rightSide.css({ width: "50%" });
        $(this).text("-");
      } else {
        // 收縮
        // 縮小左側，右側擴展到 100%
        leftSide.addClass("collapsed").css({ width: "40px" });
        if (rightSide.addClass("collapsed")) {
          rightSide.removeClass("collapsed");
          $(".right-toggle").eq(0).text("-");
        }
        rightSide.css({ width: "calc(100% - 40px)" });
        $(this).text("+");
      }
    } else {
      // 點右邊
      if (rightSide.hasClass("collapsed")) {
        rightSide.removeClass("collapsed").css({ width: "50%" });
        leftSide.css({ width: "50%" });
        $(this).text("-");
      } else {
        rightSide.addClass("collapsed").css({ width: "20px" });
        if (leftSide.addClass("collapsed")) {
          leftSide.removeClass("collapsed");
          $(".left-toggle").eq(0).text("-");
        }
        leftSide.css({ width: "calc(100% - 20px)" });
        $(this).text("+");
      }
    }
  });

  // 監聽新增與編輯按鈕
  $(".add, .edit").click(function () {
    if (!$(this).hasClass('activity')) return false;

    let isEdit = $(this).hasClass("edit");
    let isCurrent = $(this).closest('.tool-bar').hasClass('tool-bar-right') ? true : false;
    let isPrev = $(this).closest('.tool-bar').hasClass('tool-bar-left') ? true : false;

    // 如果是編輯模式，載入現有日誌數據
    if (isEdit) {
      let logData = getCurrentLogData();
      if (isCurrent) fillEditor(logData.current);
      else if (isPrev) fillEditor(logData.previous);
    } else {
      resetEditor(); // 清空表單
      
      // 自動帶入目前所選年月
      if (isCurrent) {
        const {start_date, end_date, real_year, real_week} = getWeekStartEnd(current_log_data.year, parseInt(current_log_data.week));
        $("#week_and_range").text("W" + real_week.toString().padStart(2, "0") + " (" + start_date + ' - '+ end_date + ")");
        $("#real_year").val(real_year);
        $("#real_week").val("W" + real_week.toString().padStart(2, "0"));
        $("#real_date_range").val(start_date + ' - ' + end_date);
      } else if (isPrev) {
        const {start_date, end_date, real_year, real_week} = getWeekStartEnd(current_log_data.year, parseInt(current_log_data.week) - 1);
        $("#week_and_range").text("W" + real_week.toString().padStart(2, "0") + " (" + start_date + ' - '+ end_date + ")");
        $("#real_year").val(real_year);
        $("#real_week").val("W" + real_week.toString().padStart(2, "0"));
        $("#real_date_range").val(start_date + ' - ' + end_date);
      }
    }

    $('#logEditorModal').css('display', 'flex');
  });

  // 關閉模態視窗
  $(".close, #cancelLog").click(function () {
    $('#logEditorModal').css('display', 'none');
  });

  // 監聽「新增條目」按鈕
  $(".add-task").click(function () {
    let targetContainer = $(this).data("target"); // 目標容器
    let newTaskInput = $('<div class="task-entry-container"><input type="text" class="task-entry" placeholder="新增任務"><button class="delete-task">刪除</button></div>');
    $(targetContainer).append(newTaskInput);
  });

  // 監聽刪除條目按鈕
  $(document).on("click", ".delete-task", function () {
    $(this).parent().remove();
  });

  // 儲存日誌
  $("#saveLog").click(function () {
    let logData = {
      year: parseInt($("#real_year").val()),
      week: $("#real_week").val(),
      date_range: $("#real_date_range").val(),
      task_summary: $("#task_summary").val(),
      total_hours: parseInt($("#total_hours").val()),
      tasks: {
        completed: getTasksData("#tasks_completed_container"),
        in_progress: getTasksData("#tasks_in_progress_container"),
        blocked: getTasksData("#tasks_blocked_container"),
        planned: getTasksData("#tasks_planned_container")
      },
      notes: $("#notes").val()
    };

    console.log("儲存的日誌：", logData); // 這裡可以改成 AJAX 送出到後端
    // $('#logEditorModal').css('display', 'none');

    // 發送 AJAX 請求
    $.ajax({
      url: "save_work_log.php", // PHP 處理檔案
      type: "POST",
      data: JSON.stringify(logData), // 將資料轉換為 JSON 格式
      dataType: 'json',
      success: function (response) {
        if (response.error) {
          alert("儲存失敗: " + response.error); // 顯示錯誤訊息
        } else {
          alert("工作日誌已成功儲存！");
          $('#logEditorModal').css('display', 'none'); // 關閉 Modal
          $("#loadLog").click();
        }
      },
      error: function (xhr, status, error) {
        console.error("儲存失敗：", error);
        alert("儲存失敗，請重試！");
      }
  });

  });

  // 取得每個分類的任務數據
  function getTasksData(containerId) {
    let tasks = [];
    $(containerId).find(".task-entry").each(function () {
      let task = $(this).val();
      if (task) tasks.push(task);
    });
    return tasks;
  }

  function getCurrentLogData() {
    return current_log_data.log;
  }

  // 清空表單
  function resetEditor() {
    $("#week_and_range").text("")
    $("#real_year").val("");
    $("#real_week").val("");
    $("#real_date_range").val("");
    $("#task_summary").val("");
    $("#total_hours").val("");
    $("#notes").val("");

    // 填入已完成任務
    fillTaskCategory("#tasks_completed_container");
    // 填入進行中任務
    fillTaskCategory("#tasks_in_progress_container");
    // 填入阻塞中任務
    fillTaskCategory("#tasks_blocked_container");
    // 填入計畫中任務
    fillTaskCategory("#tasks_planned_container");
  }

  // 填入現有日誌數據（假設有資料）
  function fillEditor(data) {
    console.log(data);
    $("#week_and_range").text(data.week + ' (' + data.date_range + ')');
    $("#real_year").val(data.year);
    $("#real_week").val(data.week);
    $("#real_date_range").val(data.date_range);
    $("#task_summary").val(data.task_summary);
    $("#total_hours").val(data.total_hours);
    $("#notes").val(data.notes);

    // 填入已完成任務
    fillTaskCategory("#tasks_completed_container", data.tasks.completed);
    // 填入進行中任務
    fillTaskCategory("#tasks_in_progress_container", data.tasks.in_progress);
    // 填入阻塞中任務
    fillTaskCategory("#tasks_blocked_container", data.tasks.blocked);
    // 填入計畫中任務
    fillTaskCategory("#tasks_planned_container", data.tasks.planned);
  }

  // 將任務數據填入每個分類容器
  function fillTaskCategory(containerId, tasks = null) {
    let container = $(containerId);
    container.empty(); // 清空現有條目

    // 如果沒有任務，先插入一個空的輸入框
    if (tasks === null || tasks.length === 0) {
      container.append('<input type="text" class="task-entry" placeholder="新增任務">');
    } else {
      tasks.forEach(task => {
        let taskInput = $('<div class="task-entry-container"><input type="text" class="task-entry"></div>');
        taskInput.find("input").val(task); // 填入任務內容
  
        // 插入刪除按鈕
        let deleteButton = $('<button class="delete-task">刪除</button>');
          
        deleteButton.click(function () {
          $(this).parent().remove(); // 刪除該條目
        });
  
        taskInput.append(deleteButton); // 將刪除按鈕加到條目內
        container.append(taskInput); // 插入任務條目
      });
    }
  }

  $('#notes').on('input', function() {
    console.log('resize')
    // 先清空高度，避免高度計算錯誤
    $(this).css('height', 'auto');
    // 設置為內容的高度
    $(this).css('min-height', Math.min(120, Math.max(80, this.scrollHeight)) + 'px');
  });
  $('#previous-log, #current-log').on('input', '.log-entry textarea', function() {
    console.log('resize!')
    // 清除之前的高度設置
    $(this).css('height', 'auto');
    // 根據內容計算並設置新的高度
    $(this).css('height', Math.min(120, Math.max(80, this.scrollHeight)) + 'px');
  });

  $("#year").on('change', function() {
    if (new Date().getFullYear() === parseInt($(this).val())) fill_week(true);
    else fill_week();
  });

  $("#logoutBtn").click(function () {
    $.ajax({
      url: "logout.php",
      method: "POST",
      success: function (response) {
        if (response.success) {
          console.log('bye');
          sessionStorage.removeItem("userToken"); // 清除本地儲存的登入資訊
          window.location.href = "login.html"; // 跳轉回登入頁面
        } else {
          console.log('!?');
        }
      }
    });
  });
});
