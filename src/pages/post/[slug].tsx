import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';
import Header from "../../components/Header";
import Prismic from '@prismicio/client';

import { minutesToHours } from 'date-fns';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { formatDate } from '../../util/formatDate';
import { RichText } from 'prismic-dom';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface Content {
  heading: string;
  body: {
    text: string;
  }[];
}

interface PostProps {
  post: Post;
}

export default function Post(props: PostProps) {

  const { isFallback } = useRouter();

  if (isFallback) {
    return <h1>Carregando...</h1>;
  }

  const { post } = props;

  const {
    first_publication_date,
    data: {
      title,
      banner: { url },
      author,
      content
    }
  } = post;

  const headingWordsPerMinutes = content.reduce((accumulator, { heading }) => {

    const length = heading?.split(/\s+/).length;

    return length ? length + accumulator : accumulator;

  }, 0);

  const bodyWordsPerMinutes = content.reduce((accumulator, { body }) => {
    return RichText.asText(body)?.split(/\s+/).length + accumulator;
  }, 0);

  const wordsPerMinutes = Math.ceil(
    (headingWordsPerMinutes + bodyWordsPerMinutes) / 200
  );

  const calculateReadingTime = () => {
    if (wordsPerMinutes < 1) {
      return 'Rápida leitura';
    }

    if (wordsPerMinutes < 60) {
      return `${wordsPerMinutes} min`;
    }

    return `${minutesToHours(wordsPerMinutes)} horas`;
  }

  const readingTime = calculateReadingTime();

  return (
    <>
      <Head>
        <title>Spacetraveling</title>
      </Head>

      <Header />

      <img src={url} alt={`${title} - banner`} />

      <p>{first_publication_date}</p>
      <h1>{title}</h1>
      <p>{author}</p>

      <span>{readingTime}</span>

      <section>
        {content.map(({ heading, body }) => (
          <article key={heading}>
            <h1>{heading}</h1>
            <div
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(body),
              }}
            />
          </article>
        ))}
      </section>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.slug'],
    }
  );

  const params = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths: params,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {

  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url ?? '',
      },
      author: response.data.author,
      content: response.data.content.map(({ heading, body }) => ({
        heading: heading,
        body: body,
      })),
    },
    uid: response.uid,
    first_publication_date: formatDate(response.first_publication_date),
  } as Post;

  return {
    props: {
      post
    },
    revalidate: 60 * 30,
  }
};
