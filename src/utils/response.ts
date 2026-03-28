interface IResponseBody {
  data: any | null,
  success: boolean | false,
  message: string | null,

  setMessage(message: string): void;
  setData(data: any): void;
  setSuccess(success: boolean): void;
}

export class ResponseBody implements IResponseBody {
    
    data: any | null;
    success!: boolean | false;
    message!: string | "Oops!! Something went wrong";

    setMessage(message: string): void {
        this.message = message;
    }
    setData(data: any): void {
        this.data = data;
    }
    setSuccess(success: boolean): void {
        this.success = success;
    }
  
}