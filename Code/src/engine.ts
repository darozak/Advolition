/**
 * This is the game engine that is used to log, manage, and resolve in-game actions
 * that are submitted by the robot and NPCs.
 */
class Engine {
    #world: World;
    #actions: Action[];
    // #dungeon: Dungeon;
    #dungeon: Grid;
    #hero: Hero;

    #direction = [
        new Vector(0,-1),
        new Vector(1,-1),
        new Vector(1,0),
        new Vector(1,1),
        new Vector(0,1),
        new Vector(-1,1),
        new Vector(-1,0),
        new Vector(-1,-1)
    ]

    /**
     * Creates a game engine object that is based on the specified world parameters.
     * 
     * @param world The set of parameters that define the game world.
     */
    constructor(world: World, hero: Hero) {
        this.#world = world;
        this.#hero = hero;
        // this.#dungeon = new Dungeon(world, 10);
        this.#dungeon = new Grid(world);
        this.#dungeon.generate();
        this.#actions = [];
        

        this.#hero.pos = this.#dungeon.enter;
        this.#hero.targ = this.#dungeon.enter;

        this.#dungeon.scan(hero.pos,3,this.#dungeon);
        // this.#status.tile = this.#dungeon.getTile(this.#status.pos);
    }

    /**
     * Instructs the game engine to process game events for a number of seconds while the
     * robot waits to request any further actions.
     * 
     * @param time The time in seconds that the robot has asked to wait.
     */
    wait(time: number) {
        for(let i = 0; i < time; i++) {
            this.#hero.time++;
            this.#evaluate();
        }
    }

    /**
     * Adds an action to the action cue and assigns it a completion time.
     * 
     * @param type This is the type of action that will be performed.
     * @param params These are the action-specific parameters that are needed 
     * to describe the action.
     * @param completed This is the time in seconds that the action will be completed.
     */
    addAction(type: string, params: any, completed: number) {
        this.#actions.push(new Action(type, params, this.#hero.time + completed));
    }

    /**
     * Evaluates the move action.
     * 
     * @param direction A number that represents that diraction that the robot will
     * move with zero being north and 1 - 7 representing the additional compass points
     * in a clockwise direction.
     */
    #move(direction: number) {
        this.#hero.targ = this.#hero.pos.add(this.#direction[direction]);
        if (this.#dungeon.getTileSpeed(this.#hero.targ) > 0) {
            this.#hero.pos = this.#hero.targ;
        }
        this.#hero.isMoving = false;
    }

    /**
     * Evaluates any actions in the action buffer that need to be performed and evaluates
     * them in the order that they are scheduled to be completed.
     */
    #evaluate() {
        if(this.#actions.length > 0) {
            this.#actions.sort((a,b) => a.time - b.time);
            if(this.#actions[0].time <= this.#hero.time) {
                switch (this.#actions[0].type) {
                    case "move":
                        this.#move(this.#actions[0].params);
                }
                this.#actions.shift();
            }
        }   
    }

    /**
     * Returns the robot's current status.
     */
    get status() {
        return this.#hero;
    }






}