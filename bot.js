var SlackBot = require('slackbots');
//var fs = require('fs');
var VERS = 'ALPHA';

var todo = '{ "todo": ['+'] }';

var bot = new SlackBot(
{
	token: 'xoxb-redacted',
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
		if(data.text.includes('@smidabot' @@ data.channel != null){ //for commands
			args = data.text.replace('@smidabot', '').trim().substring(' ');
			if(args.length > 1){
				if(args[0].toLowerCase()=='todo'){
					if(args.length > 2){
						
					}
				}
				bot.postMessage(data.channel, 'Valid commands: \ntodo <@assigned_to> <description>'
		}
		
		
		if(data.text.toLowerCase().includes("hi smidabot") && data.channel != null){
			console.log("contains greeting");
			getRealName(data.user).then(function(name){
				bot.postMessage(data.channel, 'Hey @' + name[0] + ' !');
			});
		}
	}
});

function getRealName(id){
	return bot.getUsers().then(function(list){
		return Promise.all(list.members.map(function (user) {
			if(user.id == id)
				return user.name;
		}));
	});
	return "can't obtain first name";
}
