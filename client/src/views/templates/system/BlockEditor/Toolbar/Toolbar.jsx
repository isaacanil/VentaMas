import React, { useState } from 'react';

function Toolbar({ onAddBlock }) {
    const [activeType, setActiveType] = useState(null);
    const [content, setContent] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleAdd = () => {
        if (content.trim()) {  // Esto verifica que no sea una cadena vacía o solo espacios
            onAddBlock(activeType, content);
            // Resetear para la siguiente entrada
            setActiveType(null);
            setContent('');
        } else {
            // Opcional: muestra algún mensaje de error o indicación al usuario.
            console.error("Error intorucciinedo texto")
        }
    };

    const handleImageUpload = async (event) => {
        const imageFile = event.target.files[0];
        if (imageFile) {
            //setUploading(true);
            //const imageUrl = await uploadToFirebase(imageFile); // Esta función debe ser definida o importada
            setContent(URL.createObjectURL(imageFile));
           
        }
    };

    const renderInputForType = (type) => {
        switch (type) {
            case 'text':
                return (
                    <div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Ingrese texto..."
                        />
                        <button onClick={handleAdd}>Añadir Texto</button>
                    </div>
                );
            case 'image':
                return (
                    <div>
                        {uploading ? (
                            <p>Subiendo imagen...</p>
                        ) : (
                            <>
                                <input
                                    type="file"
                                    onChange={handleImageUpload}
                                    accept="image/*" // Solo permite archivos de imagen
                                />
                                <button onClick={handleAdd}>Añadir Imagen</button>
                            </>
                        )}
                    </div>
                );
            case 'button':
                return (
                    <div>
                        <input
                            type="text"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Texto del botón..."
                        />
                        <button onClick={handleAdd}>Añadir Botón</button>
                    </div>
                );
            case 'title':
                return (
                    <div>
                        <input
                            type="text"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Texto del título..."
                        />
                        <button onClick={handleAdd}>Añadir Título</button>
                    </div>
                );
            // ... otros tipos de bloques
            default:
                return null;
        }
    };

    console.log(content)
    

    return (
        <div>
            {!activeType ? (
                <div>
                    <button onClick={() => setActiveType('text')}>Texto</button>
                    <button onClick={() => setActiveType('image')}>Imagen</button>
                    <button onClick={() => setActiveType('button')}>Button</button>
                    <button onClick={() => setActiveType('title')}>Title</button>
                </div>
            ) : (
                renderInputForType(activeType)
            )}
        </div>
    );
}

export default Toolbar;
