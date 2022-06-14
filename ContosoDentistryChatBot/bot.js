// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

const { QnAMaker } = require('botbuilder-ai');
const DentistScheduler = require('./dentistscheduler');
const IntentRecognizer = require("./intentrecognizer")

class DentaBot extends ActivityHandler {
    constructor(configuration, qnaOptions) {
        // call the parent constructor
        super();
        if (!configuration) throw new Error('[QnaMakerBot]: Missing parameter. configuration is required');

        // create a QnAMaker connector
        this.qnaMaker = new QnAMaker(configuration.QnAConfiguration, qnaOptions);
       
        // create a DentistScheduler connector
        this.dentistScheduler = new DentistScheduler(configuration.SchedulerConfiguration);
        // create a IntentRecognizer connector
        this.intentRecognizer = new IntentRecognizer(configuration.LuisConfiguration);

        this.onMessage(async (context, next) => {
            // send user input to QnA Maker and collect the response in a variable
            // don't forget to use the 'await' keyword
            const qnaResults = await this.qnaMaker.getAnswers(context);
            // send user input to IntentRecognizer and collect the response in a variable
            // don't forget 'await'
            const LuisResult = await this.intentRecognizer.executeLuisQuery(context);         
            // determine which service to respond with based on the results from LUIS //

            // if(top intent is intentA and confidence greater than 50){
            //  doSomething();
            //  await context.sendActivity();
            //  await next();
            //  return;
            // }
            // else {...}
            if (LuisResult.luisResult.prediction.topIntent === "ScheduleAppointment" &&
                LuisResult.intents.ScheduleAppointment.score > .8
            ) {
                // if (LuisResult.entities.$instance.date && 
                //     LuisResult.entities.$instance.date[0] &&
                //     LuisResult.entities.$instance.time &&
                //     LuisResult.entities.$instance.time[0]
                // ){
                // const date = LuisResult.entities.$instance.date[0].text;
                // const time = LuisResult.entities.$instance.time[0].text;
               
                // const schedulenewappointment = "I have scheduled an appointment with a doctor on " + date + " by " + time;
                // console.log(schedulenewappointment)

                // await context.sendActivity(schedulenewappointment);
                // }
                // else {
                // const schedulenewappointment = "I believe you want to schedule an appoinment. Please say 'Schedule appointment on date by time'";    
                // console.log(schedulenewappointment)

                // await context.sendActivity(schedulenewappointment);
                // }
                if (LuisResult.entities.$instance.time &&
                    LuisResult.entities.$instance.time[0]
                ){
                const time = LuisResult.entities.$instance.time[0].text;
                
                const schedulenewappointment = this.dentistScheduler.scheduleAppointment(time)
                console.log(schedulenewappointment)
                const schedulenewappointment1 = "An appointment is set for " + time
                console.log(schedulenewappointment1)   
                await context.sendActivity(schedulenewappointment1);
                }
                else {
                const schedulenewappointment = "I believe you want to schedule an appoinment. Please state a time to schedule";    
                console.log(schedulenewappointment)

                await context.sendActivity(schedulenewappointment);
                }

                await next();
                return;
            }
            else if (LuisResult.luisResult.prediction.topIntent === "GetAvailability" &&
            LuisResult.intents.GetAvailability.score > .8
            ) {
                // if (LuisResult.entities.$instance && 
                //     LuisResult.entities.$instance.date && 
                //     LuisResult.entities.$instance.date[0] &&
                //     LuisResult.entities.$instance.time &&
                //     LuisResult.entities.$instance.time[0]
                // ){
                // const date = LuisResult.entities.$instance.date[0].text;
                // const time = LuisResult.entities.$instance.time[0].text;
                
                // const checkavailability = "A doctor is available on " + date + " by " + time;
                // console.log(checkavailability)

                // await context.sendActivity(checkavailability);
                // }
                // else {
                //     const checkavailability = "I believe you want to check availability of a time slot. Please state date and time to check";
                //     console.log(checkavailability)
                    
                //     await context.sendActivity(checkavailability);
                // }

                const checkavailability = this.dentistScheduler.getAvailability()
                console.log(checkavailability)
                
                const checkavailability1 = "Current time slots available: 8am, 9am, 10am, 11am, 12pm, 1pm, 2pm, 3pm, 4pm"
                console.log(checkavailability1)
                await context.sendActivity(checkavailability1);
                
                await next();
                return;
            };
            
            if (qnaResults[0]) {
                console.log(`${qnaResults[0].answer}`)
                await context.sendActivity(`${qnaResults[0].answer}`);
            }
            else {
                // If no answers were returned from QnA Maker, reply with help.
                await context.sendActivity(`I'm not sure I can answer your question. Please rephrase.`
                    + ' I can also schedule an appointment or Check for available time slots');
            }

            await next();
    });

        this.onMembersAdded(async (context, next) => {
        const membersAdded = context.activity.membersAdded;
        //write a custom greeting
        const welcomeText = 'Welcome to Contoso Dentistry Chatbot. I can answer your questions, help you schedule an appointment or Check for available time slots.  You can say "Schedule an appoinment" or "Check Availability" or ask a question about our services';
        for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
            if (membersAdded[cnt].id !== context.activity.recipient.id) {
                await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
            }
        }
        // by calling next() you ensure that the next BotHandler is run.
        await next();
    });
    }
}

module.exports.DentaBot = DentaBot;
