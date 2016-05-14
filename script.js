var databases = [];

$("#data").change(function (){
  databases = [];
  for (var i = 0; i < document.getElementById("data").files.length; i++)
    getFileContents("data", i, function (contents, name) {
      eval(contents);

      parse_data(name.substring(0, name.indexOf(".")), data);
    });
});

$("#search-database").submit(function () {
  $("#search-results").text('');
  if (databases.length === 0) {
    $("#search-results").html("<br />Please load a database first.");
    return false;
  }
  var hits;
  var query = $("input[name=query]").val();
  var queries = toTitleCase(query).replace(/[^ a-zA-Z0-9]/g, '').split(" ");
  var search_method = toTitleCase($("#search-method").val());

  switch ($("#search-method").val()) {
    case "name":
      hits = search_people_perfect(queries, 0);
      break;
    case "first-name":
      hits = search_people_perfect(queries, 1);
      break;
    case "last-name":
      hits = search_people_perfect(queries, 2);
      break;
    case "id":
      hits = search_id(queries[0]);
      search_method = "id";
      break;
    case "teacher":
      hits = search_teacher_perfect(queries);
      break;
    case "class":
      hits = search_class_perfect(queries);
      break;
  }
  
  $("#hit-choices-text span[name=bold]").text("Showing people with " + search_method + " matching ");
  $("#hit-choices-text span[name=normal]").text(query);
    
  display_hits(hits);
  
  return false;
});

$("#match-all").click(function (e) {
  $("#search-results").text('');
  if (databases.length === 0) {
    $("#search-results").html("<br />Please load a database first.");
    return false;
  }
  var hits;
  var query = $("input[name=query]").val().replace(/[^ a-zA-Z0-9]/g, '');
  var search_method = toTitleCase($("#search-method").val());

  switch ($("#search-method").val()) {
    case "name":
      hits = search_people(query, 0);
      break;
    case "first-name":
      hits = search_people(query, 1);
      break;
    case "last-name":
      hits = search_people(query, 2);
      break;
    case "id":
      hits = search_id(query);
      search_method = "id";
      break;
    case "teacher":
      hits = search_teacher(query);
      break;
    case "class":
      hits = search_class(query);
      break;
  }
  
  $("#hit-choices-text span[name=bold]").text("Showing people with " + search_method + " matching ");
  $("#hit-choices-text span[name=normal]").text(query);
    
  display_hits(hits);
  
  return false;
});

$(document).on('change','#search-method',function(){
  var placeholder;
  switch ($("#search-method").val()) {
    case "name-id":
      placeholder = "full name or student id";
      break;
    case "teacher":
      placeholder = "teacher name";
      break;
    case "class":
      placeholder = "official name of class (or part of it)";
      break;
  }
  $("input[name=query]").attr('placeholder', placeholder);
});

function display_hits(hits) {
  $("#person-details").hide();
  $("#hit-choices").hide();
  if (hits.length > 1)
    show_hit_choices(hits);
  else if (hits.length === 1)
    show_person_details(hits[0]);
  else $("#search-results").html("<br />No results found.");
}

function show_person_details(person) {
  $("#hit-choices").hide();
  $("#person-details-table tbody tr")[1].remove();
  $("#person-schedule").remove();
  
  var row = $(document.createElement('tr'));
  var col1 = $(document.createElement('td')).text(person.school);
  var col2 = $(document.createElement('td')).text(person.grade);
  var col3 = $(document.createElement('td')).text(person.id);
  
  row.append(col1).append(col2).append(col3);
  $("#person-details-table tbody").append(row);
  
  $("#student-details-name").text(person.name);
  
  var table = $(document.createElement('table')).attr('id', 'person-schedule').click(function (e) {
    var target = $(e.target);
    if (target.data("period")) {
      $("#hit-choices-text span[name=bold]").text("Showing people with ");
      $("#hit-choices-text span[name=normal]").text("Per. " + target.data("period") + " " + target.data("teacher"));
      display_hits(search_period(target.data("period"), target.data("teacher").replace(/[^ a-zA-Z0-9]/g, '')));
    }
    else if (target.data("teacher")) {
      $("#hit-choices-text span[name=bold]").text("Showing students of ");
      $("#hit-choices-text span[name=normal]").text(target.data("teacher"));
      display_hits(search_teacher(target.data("teacher").replace(/[^ a-zA-Z0-9]/g, '')));
    }
    else if (target.data("class")) {
      $("#hit-choices-text span[name=bold]").text("Showing people taking the class ");
      $("#hit-choices-text span[name=normal]").text(target.data("class"));
      display_hits(search_class(target.data("class").replace(/[^ a-zA-Z0-9]/g, '')));
    }
  });
  
  var title_row = $(document.createElement('tr'));
  var title_header1 = $(document.createElement('th')).text("Period");
  var title_header2 = $(document.createElement('th')).text("Teacher");
  var title_header3 = $(document.createElement('th')).text("Class");
  
  title_row.append(title_header1).append(title_header2).append(title_header3);
  table.append(title_row);
  
  var period;
  
  for (var i = 1; i <= 8; i++) {
    period = person.period(i);
    if (period[1] === '')
      continue;
    
    row = $(document.createElement('tr'));
    col1 = $(document.createElement('td')).text(i).addClass("clickable").data('teacher', period[0]).data("period", i).attr("title", "search for students in same class").css("text-align", "center");    
    col2 = $(document.createElement('td')).text(period[0]).addClass("clickable").data('teacher', period[0]).attr("title", "search for students with teacher");
    col3 = $(document.createElement('td')).text(period[1]).addClass("clickable").data('class', period[1]).attr("title", "search for students with class");
    
    row.append(col1).append(col2).append(col3);
    table.append(row);
  }
  
  table.appendTo($("#person-details"));
  
  $("#person-details").show();
}

function show_hit_choices(hits) {
  $("#person-details").hide();
  $("#hits-table").remove();
  var table = $(document.createElement('table')).click(function (e) {
    var id = $(e.target).data('id');
    if (id) {
      var hits = $(this).data('hits');
      for (var a = 0; a < hits.length; a++) {
        if (hits[a].id == id) {
          show_person_details(hits[a]);
          return;
        }
      }
    }
  }).attr('id', 'hits-table').data('hits', hits);
  
  var title_row = $(document.createElement('tr'));
  var title_header1 = $(document.createElement('th')).text("School");
  var title_header2 = $(document.createElement('th')).text("Name");
  var title_header3 = $(document.createElement('th')).text("Grade");
  var title_header4 = $(document.createElement('th')).text("Student id");
  
  title_row.append(title_header1).append(title_header2).append(title_header3).append(title_header4);
  table.append(title_row);
  
  var row, col1, col2, col3, col4;
  
  for (var i = 0; i < hits.length; i++) {
    row = $(document.createElement('tr'));
    col1 = $(document.createElement('td')).text(hits[i].school);
    col2 = $(document.createElement('td')).text(hits[i].name).addClass('clickable').data('id', hits[i].id);
    col3 = $(document.createElement('td')).text(hits[i].grade).css('text-align', 'center');
    col4 = $(document.createElement('td')).text(hits[i].id).css("text-align", "center");
    
    row.append(col1).append(col2).append(col3).append(col4);
    table.append(row);
  }
  
  table.appendTo($("#hit-choices"));
  
  $("#num-results").text(hits.length);
  
  $("#hit-choices").show();
}

function clear_table(id) {
  var table = document.getElementById(id);
  while (table.firstChild)
    table.removeChild(table.firstChild);
}

function search_people(query, method) { // 0 any, 1 first, 2 last
  query = query.toLowerCase();
  var hits = [], person, name;
  for (var i = 0; i < databases.length; i++) {
    person = databases[i];
    name = person.name.replace(/[^ a-zA-Z0-9]/g, '').toLowerCase();
    if (method === 1)
      name = name.substring(0, name.indexOf(" "));
    else if (method === 2)
      name = name.substring(name.lastIndexOf(" "));
    if (name.indexOf(query) !== -1)
      hits.push(person);
  }
  return hits;
}

function search_people_perfect(queries, method) { // 0 any, 1 first, 2 last
  var hits = [], person, name, a, matches;
  for (var i = 0; i < databases.length; i++) {
    person = databases[i];
    name = person.name.replace(/[^ a-zA-Z0-9]/g, '').split(" ");
    if (method === 1)
      name = [name[0]];
    else if (method === 2)
      name = [name[name.length - 1]];
    matches = true;
    
    for (a = 0; a < queries.length; a++)
      if (name.indexOf(queries[a]) === -1) {
        matches = false;
        break;
      }
    if (matches)
      hits.push(person);
          
  }
  return hits;
}

function search_id(query) {
  var hits = [], person;
  for (var i = 0; i < databases.length; i++) {
    person = databases[i];
    if (person.id == query)
      hits.push(person);
  }
  return hits;
}

function search_class(query) {
  query = query.toLowerCase();
  var hits = [], person;
  for (var i = 0; i < databases.length; i++) {
    person = databases[i];
    outer:
    for (var a = 1; a <= 8; a++)
      if (person.period(a)[1].toLowerCase().replace(/[^ a-zA-Z0-9]/g, '').indexOf(query) !== -1) {
        hits.push(person);
        break outer;
      }
  }
  return hits;
}

function search_class_perfect(queries) {
  var hits = [], person, period, a, b, matches;
  for (var i = 0; i < databases.length; i++) {
    person = databases[i];
    for (a = 1; a <= 8; a++) {
      period = toTitleCase(person.period(a)[1]).replace(/[^ a-zA-Z0-9]/g, '').split(" ");
      matches = true;
      for (b = 0; b < queries.length; b++)
        if (period.indexOf(queries[b]) === -1) {
          matches = false;
          break;
        }
      if (matches) {
        hits.push(person);
        break;
      }
    }
  }
  return hits;
}

function search_teacher(query) {
  query = query.toLowerCase();
  var hits = [], person;
  for (var i = 0; i < databases.length; i++) {
    person = databases[i];
    outer:
    for (var a = 1; a <= 8; a++)
      if (person.period(a)[0].toLowerCase().replace(/[^ a-zA-Z0-9]/g, '').indexOf(query) !== -1) {
        hits.push(person);
        break outer;
      }
  }
  return hits;
}

function search_teacher_perfect(queries) {
  var hits = [], person, teacher, a, b, matches;
  for (var i = 0; i < databases.length; i++) {
    person = databases[i];
    for (a = 1; a <= 8; a++) {
      teacher = person.period(a)[0].replace(/[^ a-zA-Z0-9]/g, '').split(" ");
      matches = true;
      for (b = 0; b < queries.length; b++)
        if (teacher.indexOf(queries[b]) === -1) {
          matches = false;
          break;
        }
      if (matches) {
        hits.push(person);
        break;
      }
    }
  }
  return hits;
}

function search_period(period, query) {
  query = query.toLowerCase();
  var hits = [], person;
  for (var i = 0; i < databases.length; i++) {
    person = databases[i];
    if (person.period(period)[0].toLowerCase().replace(/[^ a-zA-Z0-9]/g, '').indexOf(query) !== -1 || person.period(period)[1].toLowerCase().replace(/[^ a-zA-Z0-9]/g, '').indexOf(query) !== -1)
      hits.push(person);
  }
  return hits;
}

function parse_data(school, data) {
  var temp_data = new Array(data.length);
  for (var i = 0; i < data.length; i++)
    temp_data[i] = create_person(school, data[i]);
  databases = databases.concat(temp_data);
}

function create_person(school, details) {
  return new Person(school, details[0], details[1].substring(details[1].lastIndexOf(' ') + 1), details[3], details[4]);
}

function Person(school, name, grade, id, schedule) {
  this.school = school;
  this.name = name;
  this.grade = grade;
  this.id = id;
  this.schedule = schedule;
}

Person.prototype.period = function(num) {
  if (num === 8 && this.schedule[num] === undefined)
    return ['', ''];
  return this.schedule[num] === undefined ? ['', "Free Period"]:this.schedule[num];
};

function toTitleCase(str)  {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function getFileContents(id, index, callback)	{
  if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
    popupError('The File APIs are not fully supported in this browser.');
    return false;
  }

  var input = document.getElementById(id);
  var file = input.files[index];
  var fr = new FileReader();
  fr.onload = function() { callback(fr.result, file.name); };
  fr.readAsText(file);
}

function most_common_name(query, num) {
  switch (query.toLowerCase()) {
    case "first":
      query = 1;
      break;
    case "last":
      query = 2;
      break;
    case "both":
      query = 0;
      break;
    case "full":
      query = -1;
      break;
    default:
      query = -1;
  }
  var names = [], popularity = [], name, split, index;
  for (var i = 0; i < databases.length; i++) {
    name = databases[i].name;
    split = databases[i].name.split(" ");
    if (query === 1)
      name = split[0];
    else if (query === 2)
      name = split[split.length - 1];
    else if (query === 0)
      name = split[0] + " " + split[split.length - 1];
    index = names.indexOf(name);
    if (index === -1) {
      names.push(name);
      popularity.push(1);
    }
    else popularity[index]++;
  }
  var sorted_names = new Array(names.length);
  var max;
  for (var b = 0; b < sorted_names.length; b++) {
    max = 0;
    for (var c = 0; c < names.length; c++)
      if (popularity[c] > max) {
        max = popularity[c];
        index = c;
      }
    sorted_names[b] = [names[index], popularity[index]];
    popularity[index] = -1;
  }
  /** For entry into excel/sheets */
//   var str1 = "", str2 = "";
//   for (var z = 0; z < num; z++) {
//     str1 += sorted_names[z][0] + ", ";
//     str2 += sorted_names[z][1] + ", ";
//   }
//   console.log(str1, str2);
  /** Normal output */
  for (var z = 0; z < num; z++)
    console.log(sorted_names[z][0].replace("&amp;", '&') + " " + sorted_names[z][1]);
  return sorted_names;
}

function most_students(query, num) {
  switch (query.toLowerCase()) {
    case "teacher":
      query = 1;
      break;
    case "class":
      query = 2;
      break;
  }
  var names = [], popularity = [], person, period, name, index;
  for (var i = 0; i < databases.length; i++) {
    person = databases[i];
    for (var a = 1; a <= 8; a++) {
      period = person.period(a);
      if (period[0]) {
        if (query === 1)
          name = period[0];
        else if (query === 2)
          name = period[1];
        index = i_index(names, name);
        if (index === -1) {
          names.push(name);
          popularity.push(1);
        }
        else popularity[index]++;
      }
    }
  }
  var sorted_names = new Array(names.length);
  var max;
  for (var b = 0; b < sorted_names.length; b++) {
    max = 0;
    for (var c = 0; c < names.length; c++)
      if (popularity[c] > max) {
        max = popularity[c];
        index = c;
      }
    sorted_names[b] = [names[index], popularity[index]];
    popularity[index] = -1;
  }
  /** For entry into excel/sheets */
  var str1 = "", str2 = "";
  for (var z = 0; z < num; z++) {
    str1 += sorted_names[z][0].replace("&amp;", '&') + "; ";
    str2 += sorted_names[z][1] + ", ";
  }
  console.log(str1, str2);
  /** Normal output */
//   for (var z = 0; z < num; z++)
//     console.log(sorted_names[z][0] + " " + sorted_names[z][1]);
  return sorted_names;
}

function least_students(query, num) {
  switch (query.toLowerCase()) {
    case "teacher":
      query = 1;
      break;
    case "class":
      query = 2;
      break;
  }
  var names = [], popularity = [], person, period, name, index;
  for (var i = 0; i < databases.length; i++) {
    person = databases[i];
    for (var a = 1; a <= 8; a++) {
      period = person.period(a);
      if (period[0]) {
        if (query === 1)
          name = period[0];
        else if (query === 2)
          name = period[1];
        index = i_index(names, name);
        if (index === -1) {
          names.push(name);
          popularity.push(1);
        }
        else popularity[index]++;
      }
    }
  }
  var sorted_names = new Array(names.length);
  var min;
  for (var b = 0; b < sorted_names.length; b++) {
    min = databases.length * 8;
    for (var c = 0; c < names.length; c++)
      if (popularity[c] < min) {
        min = popularity[c];
        index = c;
      }
    sorted_names[b] = [names[index], popularity[index]];
    popularity[index] = databases.length * 8;
  }
  /** For entry into excel/sheets */
//   var str1 = "", str2 = "";
//   for (var z = 0; z < num; z++) {
//     str1 += sorted_names[z][0].replace("&amp;", '&') + "; ";
//     str2 += sorted_names[z][1] + ", ";
//   }
//   console.log(str1, str2);
  /** Normal output */
  for (var z = 0; z < num; z++)
    console.log(sorted_names[z][0].replace("&amp;", '&') + " " + sorted_names[z][1]);
  return sorted_names;
}

function i_index(array, query) {
  query = query.toLowerCase();
  for (var i = 0; i < array.length; i++)
    if (array[i].toLowerCase() === query)
      return i;
  return -1;
}
