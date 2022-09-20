/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/task', 'N/runtime','N/record'],

    (task,runtime,record) => {

        const createTask = (customer,licenceType) => {
            var taskRec = record.create({
                type: record.Type.TASK,
                isDynamic: true
            })
            taskRec.setValue({
                fieldId: 'title',
                value: licenceType + ' license is Expired for ' +  customer
            })
            taskRec.setValue({
                fieldId: 'message',
                value: licenceType + ' license is Expired for ' +  customer
            })
            taskRec.setValue({
                fieldId: 'status',
                value:'PROGRESS'
            })
            var user = runtime.getCurrentUser().id;
            log.debug('User is ' + user)
            taskRec.setValue({
                fieldId: 'assigned',
                value: user
            })

            var taskId = taskRec.save()
            log.debug('task id ', taskId)
        }
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */

        const beforeSubmit = (context) => {

            log.debug('Scipt is running ')
            var oldRec = context.oldRecord;
            var newRec = context.newRecord;
            var newExpDate = newRec.getValue('custentity_kd_license_exp_date')
            var newExpStateLicenseDate = newRec.getValue('custentity_state_license_exp')
           var customer  = newRec.getValue('companyname')
            if(oldRec){
                oldExpDate = oldRec.getValue('custentity_kd_license_exp_date')
                oldExpStateLicenseDate = oldRec.getValue('custentity_state_license_exp')
                log.debug('Old Expiration Date is ' + oldExpDate)
                log.debug('New Expiration Date is ' + newExpDate)
                log.debug('State Old Expiration Date is ' + oldExpStateLicenseDate)
                log.debug('State New  Expiration Date is ' + newExpStateLicenseDate)
                if(Date.parse(oldExpDate) != Date.parse(newExpDate) ||Date.parse(oldExpStateLicenseDate) != Date.parse(newExpStateLicenseDate)  ){
                    log.debug('Running Sched Script')
                    try {
                        let ssTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 647,
                            deploymentId: 'customdeploykd_mr_check_lic_exp',
                            params:{
                                'custscript_kd_customer' : newRec.id
                            }
                        });
                        let ssTaskId = ssTask.submit();

                        log.debug('SS Task Id', ssTaskId)
                    } catch (e) {
                        log.error(e.message)
                    }
                }
            }



            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1) //January is 0!
            var yyyy = today.getFullYear();

            dateToday = mm + '/' + dd + '/' + yyyy;
            log.debug('Date Today ' + dateToday)
            var stateExpiDate =  newRec.getValue('custentity_state_license_exp')
            var expiDate = newRec.getValue('custentity_kd_license_exp_date')

            if(expiDate){
                var xdd = String(expiDate.getDate()).padStart(2, '0');
                var xmm = String(expiDate.getMonth() + 1) //January is 0!
                var xyyyy = expiDate.getFullYear();
                expirationDate = xmm + '/' + xdd + '/' + xyyyy;
                log.debug('expiration date ' + expirationDate)


                if (Date.parse(expirationDate) <= Date.parse(dateToday)) {
                    log.debug('DEA license is expired')
                    newRec.setValue({
                        fieldId: 'custentity_kd_license_expired',
                        value: true
                    })
                    log.debug('customer name ', customer)
                    if(customer){
                        var licenseType = 'DEA'
                        createTask(customer, licenseType);

                    }

                } else {
                    log.debug('DEA license is not expired')
                    newRec.setValue({
                        fieldId: 'custentity_kd_license_expired',
                        value: false
                    })
                }
            }

            if(stateExpiDate){
                var xdd = String(stateExpiDate.getDate()).padStart(2, '0');
                var xmm = String(stateExpiDate.getMonth() + 1) //January is 0!
                var xyyyy = stateExpiDate.getFullYear();
                expirationDate = xmm + '/' + xdd + '/' + xyyyy;
                log.debug('expiration date ' + expirationDate)


                if (Date.parse(expirationDate) <= Date.parse(dateToday)) {
                    log.debug('State license is expired')
                    newRec.setValue({
                        fieldId: 'custentity_kd_stae_license_expired',
                        value: true
                    })
                    log.debug('customer name ', customer)
                    if(customer){
                        var licenseType = 'STATE'
                        createTask(customer,licenseType);

                    }

                } else {
                    log.debug('State license is not expired')
                    newRec.setValue({
                        fieldId: 'custentity_kd_stae_license_expired',
                        value: false
                    })
                }
            }





        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (context) => {


        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
