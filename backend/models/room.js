const mongoose = require('mongoose')
const ICAL = require('ical.js')

roomNameMatch = [
    /^(?!roomservice\b)[^<>\/\\\*\|":\?]*$/,
    "Name can not contain: ^<>/\\*|\":? \n Name can not be: 'roomservice'."
]


const roomSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true, match: roomNameMatch },
    size: { type: String },
    description: { type: String, default: 'A Room.' },
    img: { type: String, default: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAABCVJREFUaEPtmWuoTlkYx3/HuA2SS4xBplAoFD64DzGYiZCiRO5RkxhThHEdYjAat6kZOe58oEg0GJTB8In5MrnU+ODeKNLUuA/6n9aa1tn2Xu/e5z3n7LfTfr6c8+73v9Z6/ut51vP8136LqCJWVEV4kBGJGcmVwDyDXQ0szTHuW2B+COZfYCTwW9T4iorIJ8BloHFg4UdAN+BWhEPbgckR3w0HjlYmkZbAHqB/xKJngQnAnZDvC4aIdnMh0DZHCv0FKNXkuGsFQaQX8HvMs2NhvYGLzpjUiXwGnEpIwsIHAafNh1SJjAfWAM3LSOQ+sADYbVItlcP+K/ApUMtDQjsu80XsBXAOuJtG1VoBLPIQ+Bv4CVhmMPo7Hfi4jJEr9/JbHZgLrPI4dAlQM/wlgFF0lgM9y0CmXIkohbYBY4EPIpx5bcpvVNNrBdwEtCFJrNyIfAhIKvjUwFOgruNdDackq9S+cr7TXHUSMCkXIg2Aw55uLX/OmHRS55Ypet8BX5nPG0yzfGY+q0jojNlikItT3kSaAj8b0Ra12EZTgh8YQBdDQFLEtX3AD0aH6flHpvTOzsUCyItId2A/0Nqz0AWzq88NRrmvitUwJA3fAk8AbY7Okqy2Kc19cpApM5H2wDXP5HJEmqmDg2lhekGMDUbi8p4D1FptAJ2rKNNa18O+jDq4XQE1u6AMd+eQ6FsPSJrLRLwYkOaKY9JYM4A/DbgR8DXwjWew1hoMXAliwogIuAlo55lwBHACeGkwyvFpQMc4DBzMVWAH8L15pmh8ARzxzHPDnD+t/7+5RPS/mtXiHM7olqebnLUhhlRCDqXgnwMnnSfywV0jbG413CWAzl2pnjAR2Onx5qFRqeMcTD/Altt8iGisLmLSWyWOAXuBgUAzz8STgF2WSDVgKrDVM0AK9ctAyDWJUsJ3jpKQe2z6jEq9taHGL5+yln4rVjptAeSU25GDDugOftt5qAtUZ6BeEk9jYNXtdfh7OFhJmii5I5jGlBCxoQxb5x9z+OwtTtFTQ5sVw6l8ICo2c4A3ZhJVwuNA/ahJReQAMDoEoNxXOVWuymoCqk5r8/EwwVi9RtoM2EarszkFGBAyx0ERUQdWuevrAI4BM52QNgHWASoIlWlSFeotUgoypdmPwDDHifPACFt+JcmtZBBGMuM/ByzVKkxFvQeL2hylvfxwu32or65jnUz+q6a7pPRiQGUwTZOy1gsOa9poNURd8P7Qwzg7XIhE3tvUjEgl51kwtbKIJD3sh0x/CgvcGGBUwoimEhGVanVg28iCPutGKMXgu0AFx6RGRCrAZ7rHZETCdqgiyq9SK4tIRD5mZ8TdmKQSJUstT5nLUitLLfPTQUGWXysp4soj4e1Lg6gxuuXZnxfizOuTPCXj4zTEOAuljsmIpB6CgAPvAKwX7YASMv6SAAAAAElFTkSuQmCC' },
    ical: { type: Object, default: ['vcalendar', [], []] },
    color: { type: String },
    isDividable: { type: Boolean, default: false },
    subrooms: { type: Array(String), default: [] },
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Room', roomSchema)