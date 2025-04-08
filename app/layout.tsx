
import "./global.css"

export const metadata = {
    title: "F1GPT",
    description:'F1 RAG Based ChatBOT : THE Place to go for all your Formula One Questions!'

}


const RootLayout = ({children})=>{

 return(
    <html lang="en">
        <body>
            {children}
        </body>

    </html>
 )
}



export default RootLayout