var SlackBot = require('slackbots');
var XLSX = require('xlsx');
var fs = require('fs');

var VERS = 'DEV';
var ID = 'U5ASQ8A75';

var inventory_workbook;
var inventory;
var bot;
fs.readFile('defaults.txt', 'utf8', function(err,data) {
	if(err) console.log(err);
	else{
		KEY = data.split('\n')[0].split(' ')[0].trim();
		bot = new SlackBot(
		{
			token: KEY,
			name: 'Smida Bot'
		});
		
		
		
		
		bot.on('start', function() //startup. need to load saved data here.
		{
			inventory_workbook = XLSX.readFile('inventory.xlsx');
			inventory = XLSX.utils.sheet_to_json(inventory_workbook.Sheets[inventory_workbook.SheetNames[0]]); //json object of inventory file.
			//console.log(inventory);
			
			//console.log(inventoryFindItem("TeTrIX LaRgE", null));
		});

		bot.on('close', function()   
		{
			inventory_workbook.Sheets[inventory_workbook.SheetNames[0]] = XLSX.utils.json_to_sheet(inventory);
			XLSX.writeFile(inventory_workbook, 'inventory.xlsx');
		});

		bot.on('message', function(data) //message parsing.
		{
			if(data.type == "message" && data.text != 'undefined'){
				if(data.text.includes('<@'+ID+'>')){ //for commands
		
					instructions = [];
					raw = data.text.replace('<@'+ID+'>', '').trim();
					remaining = raw;
					arg = null;
					while(remaining.length > 1){
						splitter = unfurl(remaining, arg);
						if(splitter.type!='end' && splitter.type!='NUL')
							instructions.push(splitter);
						remaining = remaining.substring(splitter.end).trim();
						arg = splitter.arg;
					}
					
					//console.log(instructions);
					if(arg==1)
						json = buildJSON(instructions);
					else if(arg==2){
						item = findInstructionType(instructions, 'inventory_search_item');
						if(item != null){
							console.log(item);
							item_name = replaceAll("'",'',item.contents);
							console.log(replaceAll("'",'',item.contents));
							inv_json = inventoryFindItem(item_name, null);
	
							if(inv_json){
								if(inv_json.length < 2){
									inv_json = inv_json[0];
									bot.postMessage(data.channel, '<@' + data.user + '>, ' + inv_json.item.toLowerCase() + ' is in ' +
									inv_json.location + ' on ' + inv_json.shelf + ' in ' + inv_json.box + '. There are ' + inv_json.quantity + ' ' + inv_json.item.toLowerCase() + '(s) left in stock.'); 
								}else
									bot.postMessage(data.channel, '<@' + data.user + '>, multiple results were found. \n' + stringJsonArray(inv_json));
							}else bot.postMessage(data.channel, '<@' + data.user + '>, there is no more of ' + item_name);
						}else bot.postMessage(data.channel, 'Something went wrong with your search! Make sure you are properly formatting your question. </"@smidabot where is \'item\'');
					}
				}
		
				if(data.text.toLowerCase().includes("hi smidabot") && data.channel != null){
					getRealName(data.user).then(function(name) {
						return name.forEach(function(n) {
							if(n != null)
								return bot.postMessage(data.channel, 'Hey ' + n + '!');
						});
					});
				}
			}
		});
		
		
		
		
	}
});

function stringJsonArray(arr){
	str = "";
	for(i = 0; i < arr.length; i++){
		x = arr[i];
		for(key in x){
			str+=key+': ' + x[key] + ", ";  
		}
		if(i < arr.length-1)str+="\n";
	}
	return str;
}

function replaceAll(find, replace, str) {
	var re = new RegExp(find, 'g'); str = str.replace(re, replace);
		return str;
}

function findInstructionType(instructions, type)
{
	for(i = 0; i < instructions.length; i++)
		if(instructions[i].type == type)return instructions[i];
	return null;
}

function inventoryFindItem(item_name, location)
{
	results = [];
	for(i = 0; i < inventory.length; i++){
		item = inventory[i];
		if(location != null && location != item.location) continue;
		if(item.item.toLowerCase().includes(item_name.toLowerCase()))results.push(item);
	}
	return (results.length > 0 ? results : false);
}

function buildJSON(instructions)
{
	json = "{";
	for(i = 0; i < instructions.length; i++){
		instruction = instructions[i];
		switch(instruction.type){
			case 'title':
				json += "\"title\":" + '"' + String(instruction.contents) + '"';
				break;
			case 'group':
				json += "\"group\":" + '"' + String(instruction.contents) + '"';
				break;
			case 'assigned':
				json += "\"assigned\":" + '"' + String(instruction.contents.replace('@','')) + '"';
				break;
			case 'end':
				break;
			default:
				break;
		}
		if(i < instructions.length-1)json+=', ';
	}
	json += "}";
	console.log(json);
	return JSON.parse(json);
}

function unfurl(text, arg)
{
	empty_arg = {
			type:'NUL',
			end:text.length,
			contents:''
		}
	args = text.split(' ');
	// key: 2 > storage || 1 > to-do
	if(checkFor(args[0], ["find", "where", "location"]) && (arg == 2 || arg == null)){
		info = findInfo(text,/'(.*?)'/g,0);
		if(info.text == "")return empty_arg;
		else return{
			type:"inventory_search_item",
			contents:info.text,
			end:info.end_location,
			arg:2
		}
	}
	else if(checkFor(args[0], ["add","new","put"]) && (arg == 1 || arg == null)){
		info = findInfo(text,/'(.*?)'/g,0);
		if(info.text == "")return empty_arg;
		else return {
			type:"title",
			contents:info.text,
			end:info.end_location,
			arg:1
		}
	}
	else if(checkFor(args[0], ["in", "under", "for", "group", "grouped"]) && (arg == 1 || arg == null)){
		info = findInfo(text,/'(.*?)'/g,0);
		if(info.text == "")return empty_arg;
		else return {
			type:"group",
			contents:info.text,
			end:info.end_location,
			arg:1
		}
	}
	else if(checkFor(args[0], ["assigned", "assign", "given"]) && (arg == 1 || arg == null)){
		info = findInfo(text,/@(\w+)/g,0);
		if(info.text == "")return empty_arg;
		else return {
			type:"assigned",
			contents:info.text,
			end:info.end_location,
			arg:1
		}
	}
	else{
		return {
			type:'end',
			end:text.length,
			contents:'',
			arg:arg
		}
	}
}

function checkFor(text, contents)
{
	for(i = 0; i < contents.length; i++)
		if(text == contents[i])return true;
	return false;
}
	
function findInfo(text, regex, start)
{
	out = text.substring(start).match(regex);
	if(out!=null){
		if(Array.isArray(out))out = String(out[0]);
		end_l = text.indexOf(out)+out.length;
		return{
			text:out,
			end_location:end_l
		};
	}
	else return {
		text:"",
		end_location:text.length
	};
}

function getRealName(id)
{
	return bot.getUsers().then(function(list){
		return Promise.all(list.members.map(function (user) {
			if(user.id == id)
				return user.profile.first_name;
		}));
	});
}
