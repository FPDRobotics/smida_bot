var SlackBot = require('slackbots');
var XLSX = require('xlsx');
var fs = require('fs');
var ENABLED = true;
fs.readFile('/defaults.txt', 'utf8', function(err,data) {
	if(err) console.log('error');
	else{
		console.log(data);
	}
});
var VERS = 'DEV';


var ID = 'U5ASQ8A75';
var todo = '{ "todo": ['+'] }';

var bot = new SlackBot(
{
	token: 'xoxb-redacted',
	name: 'Smida Bot'
});

bot.on('start', function() //startup. need to load saved data here.
{
});

bot.on('close', function()
{
	//fs.writeFile( "todo.json", JSON.stringify( todo ), "utf8");
});

bot.on('message', function(data) //message parsing.
{
	if(data.type == "message" && data.text != 'undefined'){
		if(data.text.includes('<@'+ID+'>')){ //for commands
		
			instructions = [];
			raw = data.text.replace('<@'+ID+'>', '').trim();
			remaining = raw;
			
			while(remaining.length > 1){
				splitter = unfurl(remaining);
				instructions.push(splitter);
				remaining = remaining.substring(splitter.end).trim();
			}
			console.log(instructions);
			json = buildJSON(instructions);
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

function updateID(){
	//x = bot.getUsers().then(function (list) {
	//	
	//}
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

function unfurl(text)
{
	empty_arg = {
			type:'NUL',
			end:text.length,
			contents:''
		}
	args = text.split(' ');
	if(checkFor(args[0], ["add","new","put"])){
		info = findInfo(text,/'(.*?)'/g,0);
		if(info.text == "")return empty_arg;
		else return {
			type:"title",
			contents:info.text,
			end:info.end_location
		}
	}
	else if(checkFor(args[0], ["in", "under", "for", "group", "grouped"])){
		info = findInfo(text,/'(.*?)'/g,0);
		if(info.text == "")return empty_arg;
		else return {
			type:"group",
			contents:info.text,
			end:info.end_location
		}
	}
	else if(checkFor(args[0], ["assigned", "assign", "given"])){
		info = findInfo(text,/@(\w+)/g,0);
		return {
			type:"assigned",
			contents:info.text,
			end:info.end_location
		}
	}
	else{
		return {
			type:'end',
			end:text.length,
			contents:''
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
