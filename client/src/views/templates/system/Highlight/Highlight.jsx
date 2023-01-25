export const highlightSearch = (name, searchTerm) => {
  const index = name.toLowerCase().indexOf(searchTerm.toLowerCase())
  if (searchTerm.length < 2) {
    return name
  }
  if (index === -1) {
    return name
  }
  return (
    <>
      {name.substring(0, index)}
      <span>{name.substring(index, index + searchTerm.length)}</span>
      {name.substring(index + searchTerm.length)}
    </>
  )
}