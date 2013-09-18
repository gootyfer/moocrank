//execute with: mongo moocrank < getMails.js
var users_mails = db.users.find({},{_id:0, email:1});
var emailString = [];
users_mails.forEach(function(user, index){
	emailString.push(user['email']);
});
print(emailString.join(", "));