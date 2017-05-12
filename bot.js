var SlackBot = require('slackbots');
//var fs = require('fs');
var VERS = 'ALPHA';

var ID = 'U5ASQ8A75';
var todo = '{ "todo": ['+'] }';

var bot = new SlackBot(
{
	token: 'xoxb-180908282243-OJOsrX0cMq4p4PUOQEyHgWcR',
	name: 'Smida Bot'
});

bot.on('start', function() { //startup. need to load saved data here, too.
	
});

bot.on('close', function() {
	//fs.writeFile( "todo.json", JSON.stringify( todo ), "utf8");
});

bot.on('message', function(data) { //message parsing.
	if(data.type == "message"){
		console.log(data);
		if(data.text.includes('<@'+ID+'>')){ //for commands
			raw = data.text.replace('<@'+ID+'>', '').trim();
			args = raw.split(' ');
			
			if(args[0].toLowerCase() == 'add'){
				if(args.length > 1){
					info = findInfo(raw,0);
					//if(info.end_location == -1) 
					console.log('quoted info ' + info.text + ", end location: " + info.end_location);
					console.log(raw.substring(info.end_location));
				}
			}
			//bot.postMessage(data.channel, "Mentioned with arguments: " + args);
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

var findInfo = function(text, start){
	out = String(text.substring(start).match(/(?:')(.*')/g)||text.substring(start).match(/(?:")(.*")/g));
	
	if(out!=null){
		end_l = text.indexOf(out)+out.length;
		return{
			text:out,
			end_location:end_l
		};
	}
	else return {
		text:"",
		end_location:-1
	};
}

function getRealName(id){
	return bot.getUsers().then(function(list){
		return Promise.all(list.members.map(function (user) {
			if(user.id == id)
				return user.profile.first_name;
		}));
	});
}
