import mongoose from "mongoose"

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  ownerId: {
    type: String,
    required: true
  },
  solved: {
    type: Boolean,
    required: true,
    default: false
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
});

export const TaskModel = mongoose.models.Task || mongoose.model("Task", taskSchema);

export type Task = {
  _id: string,
  title: string,
  ownerId: string,
  solved: boolean,
  date: Date,
}

export type GetTasksResponse = {
  success: boolean,
  tasks: Task[]
}

export type GetTaskResponse = {
  success: boolean,
  task?: Task
}

export type UpdateTaskResponse = {
  success: boolean,
}

export type DeleteTaskResponse = {
  success: boolean,
}

/**
 * The Task server class that will be deployed on the genezio infrastructure.
 */
export class TaskService {
  constructor() {
    mongoose.connect("mongodb+srv://genezio:genezio@cluster0.c6qmwnq.mongodb.net/?retryWrites=true&w=majority");
  }

  /**
   * Method that returns all tasks for a giving user ID.
   * Only authenticated users with a valid token can access this method.
   * 
   * The method will be exported via SDK using genezio.
   * 
   * @param {*} userId The user ID.
   * @returns An object containing two properties: { success: true, tasks: tasks }
   */
  async getAllTasksByUser(userId: string): Promise<GetTasksResponse> {
    console.log(`Get all tasks by user request received with userID ${userId}`)

    const tasks = (await TaskModel.find({ ownerId: userId }))
      .map((task) => ({
        title: task.title,
        ownerId: task.ownerId,
        solved: task.solved,
        date: task.date,
        _id: task._id.toString()
      }));
    return { success: true, tasks: tasks };
  }

  /**
   * Method that creates a task for a giving user ID.
   * Only authenticated users with a valid token can access this method.
   * 
   * The method will be exported via SDK using genezio.
   * 
   * @param {*} title The tasktitle.
   * @param {*} ownerId The owner's of the task ID.
   * @returns An object containing two properties: { success: true, tasks: tasks }
   */
  async createTask(title: string, ownerId: string): Promise<GetTaskResponse> {
    console.log(`Create task request received for user with id ${ownerId} with title ${title}`)

    const task = await TaskModel.create({
      title: title,
      ownerId: ownerId
    });

    return {
      success: true,
      task: { title: title, ownerId: ownerId, _id: task._id.toString(), solved: false, date: new Date() }
    };
  }

  /**
   * Method that creates a task for a giving user ID.
   * Only authenticated users with a valid token can access this method.
   * 
   * The method will be exported via SDK using genezio.
   * 
   * @param {*} id The task's id.
   * @param {*} title The task's title.
   * @param {*} solved If the task is solved or not.
   * @returns An object containing two properties: { success: true }
   */
  async updateTask(id: string, title: string, solved: boolean): Promise<UpdateTaskResponse> {
    console.log(`Update task request received with id ${id} with title ${title} and solved value ${solved}`)

    await TaskModel.updateOne(
      { _id: id },
      {
        title: title,
        solved: solved
      }
    );

    return { success: true };
  }

  /**
   * Method that deletes a task for a giving user ID.
   * Only authenticated users with a valid token can access this method.
   * 
   * The method will be exported via SDK using genezio.
   * 
   * @param {*} title The tasktitle.
   * @returns An object containing one property: { success: true }
   */
  async deleteTask(id: string): Promise<DeleteTaskResponse> {
    console.log(`Delete task with id ${id} request received`)

    await TaskModel.deleteOne({ _id: id });

    return { success: true };
  }
}
