import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {FiUpload} from 'react-icons/fi';
import './styles.css';

interface Props{
    //Recebe um parametro do tipo FILE  e não tem retorno(void)
    onFileUploaded: (file:File) => void;
}

const Dropzone: React.FC<Props> =  ({onFileUploaded}) =>  {// (props) ou dedestruturar e pegar apenas o parametro onFileUploaded
    
    const [selectedFileUrl,setSelectedFileUrl] = useState('');

    /**
     * Estudar useCallback
     * Conseguir memorizar uma função para que ela possa ser recriada somente quando o valor
     * de alguma variável mudar ([onFileUploaded])
     * Por que por padrão quando a gente criar uma função nova dentro de um component react
     * sempre que um estado mudar essa funcao é criada na memória do zero
     * por isso cria-se(rocketseat nesse exemplo) função usando useCallback 
     */
    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        const fileUrl = URL.createObjectURL(file);
        setSelectedFileUrl(fileUrl);

        onFileUploaded(file);

        console.log(acceptedFiles);
    }, [onFileUploaded])//onFileUploaded aqui para sempre chamar quando a funcao mudar
    const { getRootProps, getInputProps } = useDropzone({ 
        onDrop,
        accept: 'image/*' 
    })

    return (
        <div className="dropzone" {...getRootProps()}>
            <input {...getInputProps()} accept='image/*'/>

            {
                selectedFileUrl
                ?
                    <img src={selectedFileUrl} alt="" />
                : (
                    <p> 
                        <FiUpload />
                        imagem do estabelecimento
                    </p>
                )
            }
           
        </div>
    )
}

export default Dropzone;