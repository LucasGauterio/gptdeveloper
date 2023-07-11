export default class History {

    constructor() {
        this.databases = {}
    }

    getDatabase(project) {
        return this.databases[project]
    }

    add(database){
        this.lastProject = database.project
        this.databases[this.lastProject] = {...database}
        this.store()
    }
    
    retrieve(){
        const history = JSON.parse(localStorage.getItem('history'))
        if(history){
            this.databases = history.databases
            this.lastProject = history.lastProject
        }
    }

    remove(databaseKey){
        delete this.databases[databaseKey]
        this.store()
    }

    store(){
        if(this.databases.length === 0){
            this.lastProject = null
        }
        localStorage.setItem('history', JSON.stringify({...this}))
    }
}